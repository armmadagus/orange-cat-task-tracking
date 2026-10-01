begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

-- Fixed UUIDs keep assertions readable. The whole file runs in one transaction
-- and is rolled back by pgTAP, so no fixture survives the test run.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000101', 'authenticated', 'authenticated', 'rls-admin@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"RLS Admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000102', 'authenticated', 'authenticated', 'rls-member@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"RLS Member"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000103', 'authenticated', 'authenticated', 'rls-guest@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"RLS Guest"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000104', 'authenticated', 'authenticated', 'rls-outsider@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"RLS Outsider"}', now(), now());

insert into public.workspaces (id, name, created_by)
values
  ('00000000-0000-0000-0000-000000000201', 'RLS Workspace', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000202', 'Outsider Workspace', '00000000-0000-0000-0000-000000000104');

insert into public.workspace_members (workspace_id, user_id, role)
values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'admin'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000102', 'member'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000103', 'guest'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000104', 'admin');

insert into public.projects (id, workspace_id, name, created_by)
values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', 'RLS Project', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000202', 'Outsider Project', '00000000-0000-0000-0000-000000000104');

insert into public.tasks (id, project_id, title, created_by, position)
values
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000301', 'Shared RLS Task', '00000000-0000-0000-0000-000000000101', 1000),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000301', 'Delete RLS Task', '00000000-0000-0000-0000-000000000101', 2000),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000302', 'Private Outsider Task', '00000000-0000-0000-0000-000000000104', 1000);

select ok(
  (
    select bool_and(c.relrowsecurity)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any(array['profiles', 'workspaces', 'workspace_members', 'projects', 'tasks'])
  ),
  'All exposed application tables have RLS enabled'
);

set local role authenticated;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
select is((select count(*) from public.workspaces where id = '00000000-0000-0000-0000-000000000201'), 1::bigint, 'Admin can read their workspace');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);
select is((select count(*) from public.workspaces where id = '00000000-0000-0000-0000-000000000201'), 1::bigint, 'Member can read their workspace');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000103', true);
select is((select count(*) from public.workspaces where id = '00000000-0000-0000-0000-000000000201'), 1::bigint, 'Guest can read their workspace');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000104', true);
select is((select count(*) from public.workspaces where id = '00000000-0000-0000-0000-000000000201'), 0::bigint, 'Outsider cannot read another workspace');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000103', true);
select is((select count(*) from public.tasks where project_id = '00000000-0000-0000-0000-000000000301'), 2::bigint, 'Guest can read shared tasks');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000104', true);
select is((select count(*) from public.tasks where project_id = '00000000-0000-0000-0000-000000000301'), 0::bigint, 'Outsider cannot read shared tasks');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);
select lives_ok(
  $$insert into public.tasks (id, project_id, title, created_by, position) values ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000301', 'Member-created Task', '00000000-0000-0000-0000-000000000102', 3000)$$,
  'Member can insert a task in their workspace'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000103', true);
select throws_ok(
  $$insert into public.tasks (id, project_id, title, created_by, position) values ('00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000301', 'Guest-created Task', '00000000-0000-0000-0000-000000000103', 4000)$$,
  '42501',
  'new row violates row-level security policy for table "tasks"',
  'Guest cannot insert a task'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);
select results_eq(
  $$update public.tasks set title = 'Member updated' where id = '00000000-0000-0000-0000-000000000401' returning 1$$,
  $$values (1)$$,
  'Member can update a shared task'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000103', true);
select results_eq(
  $$update public.tasks set title = 'Guest updated' where id = '00000000-0000-0000-0000-000000000401' returning 1$$,
  $$select 1 where false$$,
  'Guest cannot update a shared task'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
select lives_ok(
  $$insert into public.projects (id, workspace_id, name, created_by) values ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000201', 'Admin-created Project', '00000000-0000-0000-0000-000000000101')$$,
  'Admin can insert a project'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);
select throws_ok(
  $$insert into public.projects (id, workspace_id, name, created_by) values ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000201', 'Member-created Project', '00000000-0000-0000-0000-000000000102')$$,
  '42501',
  'new row violates row-level security policy for table "projects"',
  'Member cannot insert a project'
);

select lives_ok(
  $$select public.soft_delete_task('00000000-0000-0000-0000-000000000402')$$,
  'Member can soft-delete a task'
);

select is((select count(*) from public.tasks where id = '00000000-0000-0000-0000-000000000402'), 0::bigint, 'Soft-deleted task is hidden by RLS');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000103', true);
select throws_ok(
  $$select public.soft_delete_task('00000000-0000-0000-0000-000000000401')$$,
  'P0001',
  'Insufficient permission to delete tasks',
  'Guest cannot soft-delete a task'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000104', true);
select is((select count(*) from public.profiles where id = '00000000-0000-0000-0000-000000000101'), 0::bigint, 'Outsider cannot read another workspace profile');

select * from finish();
rollback;
