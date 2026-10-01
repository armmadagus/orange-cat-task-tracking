-- Phase 1 foundation: schema, integrity constraints, grants and workspace-scoped RLS.
-- All authorization comes from workspace_members. User-editable auth metadata is
-- intentionally not used for access control.

create type public.workspace_role as enum ('admin', 'member', 'guest');
create type public.task_status as enum ('todo', 'in_progress', 'done');
create type public.task_priority as enum ('low', 'medium', 'high');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) <= 120)
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_name_length check (char_length(name) between 1 and 100)
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null,
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  color text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_name_length check (char_length(name) between 1 and 120),
  constraint projects_description_length check (description is null or char_length(description) <= 2000),
  constraint projects_color_format check (color is null or color ~ '^#[0-9A-Fa-f]{6}$')
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  parent_task_id uuid references public.tasks(id),
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority public.task_priority,
  assignee_id uuid references public.profiles(id),
  start_date date,
  due_date date,
  position numeric not null default 0,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint tasks_title_length check (char_length(title) between 1 and 200),
  constraint tasks_description_length check (description is null or char_length(description) <= 10000),
  constraint tasks_date_order check (start_date is null or due_date is null or due_date >= start_date),
  constraint tasks_parent_not_self check (parent_task_id is null or parent_task_id <> id)
);

create index workspace_members_user_workspace_idx on public.workspace_members(user_id, workspace_id);
create index projects_workspace_idx on public.projects(workspace_id);
create index tasks_project_deleted_idx on public.tasks(project_id, deleted_at);
create index tasks_project_status_position_idx on public.tasks(project_id, status, position);
create index tasks_parent_idx on public.tasks(parent_task_id);
create index tasks_assignee_idx on public.tasks(assignee_id);
create index tasks_project_due_date_idx on public.tasks(project_id, due_date);

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function private.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function private.set_updated_at();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1), ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_workspace_role(
  target_workspace_id uuid,
  allowed_roles public.workspace_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role = any(allowed_roles)
  );
$$;

revoke all on function private.is_workspace_member(uuid) from public, anon;
revoke all on function private.has_workspace_role(uuid, public.workspace_role[]) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.has_workspace_role(uuid, public.workspace_role[]) to authenticated;

create or replace function public.create_workspace(workspace_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  new_workspace_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if char_length(trim(workspace_name)) < 1 or char_length(trim(workspace_name)) > 100 then
    raise exception 'Workspace name must be between 1 and 100 characters';
  end if;

  insert into public.workspaces (name, created_by)
  values (trim(workspace_name), actor_id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, actor_id, 'admin');

  return new_workspace_id;
end;
$$;

revoke all on function public.create_workspace(text) from public, anon;
grant execute on function public.create_workspace(text) to authenticated;

create or replace function private.validate_task_relations()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  parent_project_id uuid;
  parent_parent_id uuid;
  task_workspace_id uuid;
begin
  if new.parent_task_id is not null then
    select project_id, parent_task_id
      into parent_project_id, parent_parent_id
    from public.tasks
    where id = new.parent_task_id;

    if parent_project_id is null then
      raise exception 'Parent task was not found';
    end if;
    if parent_project_id <> new.project_id then
      raise exception 'Task and subtask must belong to the same project';
    end if;
    if parent_parent_id is not null then
      raise exception 'Subtasks cannot be nested more than one level';
    end if;
  end if;

  if new.assignee_id is not null then
    select p.workspace_id into task_workspace_id
    from public.projects p
    where p.id = new.project_id;

    if not exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = task_workspace_id
        and wm.user_id = new.assignee_id
    ) then
      raise exception 'Assignee must be a member of the project workspace';
    end if;
  end if;

  return new;
end;
$$;

create trigger tasks_validate_relations
before insert or update of project_id, parent_task_id, assignee_id on public.tasks
for each row execute function private.validate_task_relations();

create or replace function private.prevent_last_admin_removal()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.role = 'admin' and (tg_op = 'DELETE' or new.role <> 'admin') then
    if not exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = old.workspace_id
        and wm.user_id <> old.user_id
        and wm.role = 'admin'
    ) then
      raise exception 'A workspace must keep at least one admin';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger workspace_members_keep_admin
before update or delete on public.workspace_members
for each row execute function private.prevent_last_admin_removal();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

create policy profiles_select_shared_workspace
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1
    from public.workspace_members mine
    join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = profiles.id
  )
);

create policy profiles_update_own
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy workspaces_select_member
on public.workspaces for select to authenticated
using (private.is_workspace_member(id));

create policy workspaces_insert_owner
on public.workspaces for insert to authenticated
with check (created_by = (select auth.uid()));

create policy workspaces_update_admin
on public.workspaces for update to authenticated
using (private.has_workspace_role(id, array['admin']::public.workspace_role[]))
with check (private.has_workspace_role(id, array['admin']::public.workspace_role[]));

create policy workspace_members_select_member
on public.workspace_members for select to authenticated
using (private.is_workspace_member(workspace_id));

create policy workspace_members_insert_admin_or_bootstrap
on public.workspace_members for insert to authenticated
with check (
  private.has_workspace_role(workspace_id, array['admin']::public.workspace_role[])
  or (
    user_id = (select auth.uid())
    and role = 'admin'
    and exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.created_by = (select auth.uid())
    )
    and not exists (
      select 1 from public.workspace_members existing
      where existing.workspace_id = workspace_members.workspace_id
    )
  )
);

create policy workspace_members_update_admin
on public.workspace_members for update to authenticated
using (private.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]))
with check (private.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));

create policy workspace_members_delete_admin
on public.workspace_members for delete to authenticated
using (private.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));

create policy projects_select_member
on public.projects for select to authenticated
using (private.is_workspace_member(workspace_id));

create policy projects_insert_admin
on public.projects for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.has_workspace_role(workspace_id, array['admin']::public.workspace_role[])
);

create policy projects_update_admin
on public.projects for update to authenticated
using (private.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]))
with check (private.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));

create policy projects_delete_admin
on public.projects for delete to authenticated
using (private.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));

create policy tasks_select_member
on public.tasks for select to authenticated
using (
  deleted_at is null
  and exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
      and private.is_workspace_member(p.workspace_id)
  )
);

create policy tasks_insert_editor
on public.tasks for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
      and private.has_workspace_role(
        p.workspace_id,
        array['admin', 'member']::public.workspace_role[]
      )
  )
);

create policy tasks_update_editor
on public.tasks for update to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
      and private.has_workspace_role(
        p.workspace_id,
        array['admin', 'member']::public.workspace_role[]
      )
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
      and private.has_workspace_role(
        p.workspace_id,
        array['admin', 'member']::public.workspace_role[]
      )
  )
);

revoke all on public.profiles, public.workspaces, public.workspace_members, public.projects, public.tasks from anon;
revoke all on public.profiles, public.workspaces, public.workspace_members, public.projects, public.tasks from authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update on public.tasks to authenticated;
