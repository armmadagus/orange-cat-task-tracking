-- Phase 2: member lookup and transactional task soft deletion.
-- Explicit grants are included because new Supabase projects no longer expose
-- public objects to the Data API automatically.

alter table public.profiles add column email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id;

create unique index profiles_email_lower_unique_idx
on public.profiles (lower(email))
where email is not null;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1), ''),
    new.raw_user_meta_data ->> 'avatar_url',
    new.email
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create or replace function private.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

revoke all on function private.sync_user_email() from public, anon, authenticated;

create trigger on_auth_user_email_changed
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function private.sync_user_email();

create or replace function public.add_workspace_member_by_email(
  target_workspace_id uuid,
  member_email text,
  member_role public.workspace_role
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_user_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if not private.has_workspace_role(
    target_workspace_id,
    array['admin']::public.workspace_role[]
  ) then
    raise exception 'Only workspace admins can add members';
  end if;

  select id into target_user_id
  from public.profiles
  where lower(email) = lower(trim(member_email));

  if target_user_id is null then
    raise exception 'No registered user found for this email';
  end if;

  if exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = target_user_id
  ) then
    raise exception 'This user is already a workspace member';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (target_workspace_id, target_user_id, member_role);

  return target_user_id;
end;
$$;

revoke all on function public.add_workspace_member_by_email(uuid, text, public.workspace_role)
from public, anon;
grant execute on function public.add_workspace_member_by_email(uuid, text, public.workspace_role)
to authenticated;

create or replace function public.soft_delete_task(target_task_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_project_id uuid;
  target_workspace_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  select t.project_id, p.workspace_id
    into target_project_id, target_workspace_id
  from public.tasks t
  join public.projects p on p.id = t.project_id
  where t.id = target_task_id and t.deleted_at is null;

  if target_project_id is null then
    raise exception 'Task not found';
  end if;

  if not private.has_workspace_role(
    target_workspace_id,
    array['admin', 'member']::public.workspace_role[]
  ) then
    raise exception 'Insufficient permission to delete tasks';
  end if;

  update public.tasks
  set deleted_at = now(), updated_at = now()
  where project_id = target_project_id
    and deleted_at is null
    and (id = target_task_id or parent_task_id = target_task_id);
end;
$$;

revoke all on function public.soft_delete_task(uuid) from public, anon;
grant execute on function public.soft_delete_task(uuid) to authenticated;

-- Keep Data API privileges explicit and least-privileged. Email mirrors
-- auth.users and must never be editable through the profiles Data API.
revoke update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;
grant select, insert, update on public.tasks to authenticated;
