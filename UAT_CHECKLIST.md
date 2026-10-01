# MVP UAT Checklist

Record tester, environment, build/deployment ID, date, and evidence for every run.

## Admin

- Sign in/out, create/edit/delete Project, manage members, and preserve at least one Admin.
- Create Task/Subtask, edit every field, soft-delete, and confirm updates across Kanban, List, Timeline, Drawer, and Gantt.
- Expand/collapse Gantt hierarchy, verify parent progress from completed subtasks, and confirm undated rows have no bar.

## Member

- View all Workspace projects and members, create/edit/delete Task/Subtask, and confirm Project/member administration is unavailable.
- Exercise Kanban status movement and Timeline date movement/resize with pointer and keyboard.
- Exercise Gantt move/resize on desktop and Drawer date editing in mobile list-first mode.

## Guest

- Open every available view and Task Drawer.
- Confirm create, edit, delete, drag, resize, and direct database mutations are rejected.

## Responsive and accessibility

- Test 375, 768, 1024, and 1440 px in supported browsers.
- Complete primary flows with keyboard only; verify visible focus, Escape-close, trapped Drawer focus, focus restoration, labels, and non-color status cues.
- Verify Gantt sticky table/horizontal scroll on desktop and list/chart toggle at 375 px.

## Sign-off

- No Critical/High defects remain open.
- RLS permission suite, cross-view consistency suite, static checks, production build, and browser smoke tests pass.
- Record Vercel preview URL/build ID, Supabase backup/PITR policy, Web Analytics enablement, Speed Insights enablement, and 30-day pilot owner.
