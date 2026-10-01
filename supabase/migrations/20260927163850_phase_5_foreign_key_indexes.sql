-- Cover foreign-key columns used by joins and referential checks.
create index if not exists projects_created_by_idx
  on public.projects(created_by);

create index if not exists tasks_created_by_idx
  on public.tasks(created_by);

create index if not exists workspaces_created_by_idx
  on public.workspaces(created_by);
