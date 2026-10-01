# Engineering Handoff — Orange Cat Task Tracking

อัปเดตล่าสุด: 29 กันยายน 2026  
Workspace path: `/Users/pannavich/Documents/Task Tracking`

## 1. เป้าหมายของโปรเจกต์

เว็บแอป Task Tracking สำหรับทีมประมาณ 10 คน ใช้ Task records ชุดเดียวร่วมกันระหว่าง Kanban, List, Timeline และ Gantt รองรับสิทธิ์ `admin`, `member`, `guest` ทั้งใน UI และ Supabase RLS ตามรายละเอียดใน:

- `PRD.md`
- `DESIGN.md`
- `DEVELOPMENT_PLAN.md`
- `design-template/`

Tech stack ปัจจุบัน:

- Next.js 16.3.6 App Router, React 19.3, TypeScript 6
- Tailwind CSS 4 และ CSS design tokens ใน `src/app/globals.css`
- Supabase Auth, PostgreSQL, RLS และ `@supabase/ssr`
- Zod สำหรับ server-side validation
- dnd-kit สำหรับ Kanban drag-and-drop
- lucide-react สำหรับ icons

> สำคัญ: `AGENTS.md` ระบุว่า Next.js รุ่นนี้มี breaking changes ต้องอ่านเอกสารที่เกี่ยวข้องใน `node_modules/next/dist/docs/` ก่อนแก้ Next.js code ทุกครั้ง

## 2. สถานะการพัฒนา

### Phase 1 — เสร็จแล้ว

- Responsive application shell สำหรับ desktop/tablet/mobile
- Supabase Email/Password Auth แบบ cookie session
- Login, logout และ onboarding Workspace แรก
- Mandatory login gate ผ่าน Next.js 16 Proxy
- Schema: profiles, workspaces, workspace_members, projects, tasks/subtasks
- RLS และ grants สำหรับ Admin/Member/Guest/cross-workspace
- Project CRUD สำหรับ Admin
- Loading, error, forbidden และ not-found states

### Phase 2 — เสร็จแล้ว

- Team Management: เพิ่มสมาชิกที่สมัครแล้วด้วยอีเมล เปลี่ยน role และ remove
- ป้องกันการลบ/ลดสิทธิ์ Admin คนสุดท้าย
- Task/Subtask CRUD โดยใช้ตาราง `tasks` เดียวกันและจำกัดความลึก 1 ระดับ
- Task Detail Drawer
- List View พร้อม hierarchy, inline edit และ mobile cards
- Search/filter/sort, “งานของฉัน” และ URL-persisted state
- Soft delete Task พร้อม Subtask
- Optimistic update และ rollback/error feedback

### Phase 3 — เสร็จแล้ว

- Kanban 3 สถานะ: `todo`, `in_progress`, `done`
- Task card แสดง priority, assignee, due/overdue และ subtask progress
- Quick add ต่อคอลัมน์
- Drag-and-drop status/position ด้วย dnd-kit
- Status select เป็น keyboard-accessible alternative
- Optimistic update และ rollback
- Shared Task Drawer ระหว่าง Kanban/List
- Mobile segmented status tabs
- Guest read-only
- Cross-view filters ระหว่าง Kanban/List ผ่าน URL
- Privacy-safe CustomEvent analytics โดยไม่ส่ง title/description
- Kanban เป็น default project view

### Phase 4 — เสร็จแล้ว

- เพิ่ม shared date-grid utilities: Week/Month range, today marker, date/pixel mapping และ task date normalization
- เพิ่ม Timeline vertical slice สำหรับ Task หลัก พร้อม shared URL filters, horizontal scroll, Week/Month zoom และ Task Drawer เดิม
- รองรับ due-only milestone, start-only one-day bar และกลุ่ม “ยังไม่กำหนดเวลา”
- Desktop แก้วันที่ผ่าน Timeline date editor; Mobile แก้ผ่าน shared Task Drawer
- Timeline ใช้ `tasks` records และ `updateTask` Server Action ชุดเดิม ไม่มี schema/table ซ้ำ
- เพิ่ม date-order validation ที่ shared Server Action และ client feedback ก่อนชน database constraint
- เพิ่ม unit tests ของ date-grid/date validation
- เพิ่ม Timeline desktop pointer drag สำหรับเลื่อนทั้งช่วงและ resize ขอบซ้าย/ขวา
- เพิ่ม keyboard alternative: Arrow Left/Right สำหรับ move/resize ทีละวัน
- interaction engine รักษา due-only/start-only semantics และ clamp ไม่ให้ช่วงวันกลับด้าน
- เพิ่ม Gantt split view: sticky task table + date grid, Task/Subtask hierarchy, expand/collapse และ progress calculation
- Task/Subtask ที่ไม่มีวันยังแสดงในตารางโดยไม่มี bar; mobile เป็น list-first และสลับดู chart ได้
- Gantt windowing เมื่อเกิน 200 แถว พร้อม overscan และใช้ shared date-grid/task mutations โดยไม่สร้างข้อมูลซ้ำ
- เพิ่ม unit test ของ progress และ authenticated E2E flow ครบ Kanban/List/Timeline/Gantt รวม date mutation

### Phase 5 — Production deployment พร้อมใช้งาน; รอ paid-plan gates และ UAT sign-off

- เพิ่ม `server-only` boundary ให้ workspace/task/Supabase server data modules
- เพิ่ม regression tests สำหรับ secret scanning, RLS foundation และ task mutation authorization/validation
- เพิ่ม focus trap, Escape close, initial focus และ focus restoration ให้ shared Task Drawer
- เพิ่ม root `global-error` fallback ที่ retry ได้และรองรับภาษาไทย
- เพิ่ม release/monitoring/rollback runbook ใน `OPERATIONS.md`
- เพิ่ม role-based และ responsive UAT checklist ใน `UAT_CHECKLIST.md`
- เพิ่ม pgTAP RLS suite 17 assertions สำหรับ Admin/Member/Guest/Outsider ใน `supabase/tests/database/rls.test.sql`
- เพิ่ม Playwright production E2E สำหรับ login gate/responsive และ authenticated cross-view/mutation flows แบบ credential-gated + explicit mutation opt-in
- เพิ่ม Vercel Web Analytics + Speed Insights และ analytics allowlist ที่ไม่ส่ง title/description/email/record IDs
- เพิ่ม covering indexes สำหรับ `created_by` foreign keys และ apply migration ไป linked Supabase แล้ว
- เพิ่ม response security headers ระดับแอป: HSTS, nosniff, frame deny, strict referrer policy และปิด camera/microphone/geolocation/browsing-topics
- Supabase schema lint ผ่าน; Performance Advisor ไม่เหลือ missing-index finding
- สร้าง Vercel project `pan-vich1/orange-cat-task-tracking`, ตั้ง `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` สำหรับ Production/Preview/Development และเปิด Web Analytics แล้ว
- Production ล่าสุดหลังเปิด Web Analytics Ready และ aliased ที่ `https://orange-cat-task-tracking.vercel.app`
- Preview หลังเปิด Web Analytics Ready ที่ `https://orange-cat-task-tracking-j2m73chzj-pan-vich1.vercel.app`
- Speed Insights เปิดไม่ได้ผ่าน API เพราะบัญชีปัจจุบันตอบกลับว่าต้องใช้ Pro/Enterprise; ไม่มีการอัปเกรดหรือสร้างค่าใช้จ่าย
- Supabase leaked-password protection เปิดไม่ได้เพราะใช้ได้เฉพาะ Pro ขึ้นไป; ไม่มีการอัปเกรดหรือสร้างค่าใช้จ่าย
- ตั้ง Supabase Auth Site URL เป็น production และเพิ่ม redirect allowlist สำหรับ production, Vercel preview ของทีม และ localhost แล้ว

สิ่งที่ยังเหลือ: paid-plan gates สำหรับ Supabase leaked-password protection และ Vercel Speed Insights, Git integration/custom domain ถ้าต้องการ, formal `supabase test db`, authenticated E2E, cross-browser/persona UAT, field performance และ production sign-off โดยรอบ deployment นี้ไม่ได้รัน test/verification ตามคำขอของผู้ใช้

## 3. Supabase ปัจจุบัน

- Project name: `trask-tracking` (ชื่อนี้สะกดตามที่สร้างไว้)
- Project ref: `bbsgktwqdoaqkizjwztl`
- Organization: `Pannavich`
- Region: Singapore (`ap-southeast-1`)
- Project ถูก link กับ Supabase CLI แล้ว
- Migrations ถูก apply แล้ว:
  - `supabase/migrations/20260927034154_phase_1_foundation.sql`
  - `supabase/migrations/20260927055345_phase_2_core_tasks.sql`
  - `supabase/migrations/20260927163850_phase_5_foreign_key_indexes.sql`
- Phase 3 ใช้ `tasks.status` และ `tasks.position` เดิม จึงไม่มี migration เพิ่ม
- `.env.local` มี environment สำหรับ local development และอาจมี session material ที่ Vercel CLI สร้างให้
- `.env.local` ถูก ignore; ห้าม copy, commit, log หรือย้ายค่า password, service-role key, access token, `VERCEL_OIDC_TOKEN` หรือ secret ใด ๆ ไปไว้ใน source, client bundle หรือเอกสาร

Admin สำหรับทดสอบ:

- Email: `armflipflop@gmail.com`
- Profile display name: `armflipflop`
- Role: `admin`
- Workspace: `Main Engineering Hub`
- Workspace ID: `0536ee2c-7165-455e-bd1f-829df85e4d63`
- Auth user ID: `f936d8aa-71a1-4169-b7b4-216f535f3db3`
- Email ถูก confirm แล้ว

รหัสผ่านถูกส่งให้ผู้ใช้ในแชทเดิมและ **ไม่บันทึกไว้ในไฟล์นี้หรือ repository** หากไม่มีรหัสผ่าน ให้ผู้ใช้ reset ผ่าน Supabase แทนการค้นหา secret จากไฟล์หรือ logs

## 4. Auth flow ที่ต้องรักษาไว้

ไฟล์ entry point ต้องอยู่ที่ `src/proxy.ts` เพราะโปรเจกต์ใช้ `src/app` การวาง `proxy.ts` ที่ repository root จะทำให้ Next.js 16 ไม่โหลด Proxy

Flow ปัจจุบัน:

```text
ไม่มี Supabase env
  └─> /setup เท่านั้น

มี Supabase env + ไม่มี valid session
  └─> /login?next=<original path and query>

ล็อกอินแล้ว + ยังไม่มี membership
  └─> /onboarding

ล็อกอินแล้ว + มี membership
  └─> Workspace / Project / Members / Tasks
```

รายละเอียดสำคัญ:

- `src/lib/supabase/proxy.ts` ใช้ `supabase.auth.getClaims()` สำหรับ optimistic session verification
- Server data layer ใช้ `supabase.auth.getUser()` ก่อนอ่านข้อมูลผู้ใช้
- ค่า `next` ต้องเริ่มด้วย `/` และห้ามเริ่มด้วย `//` เพื่อป้องกัน open redirect
- Demo Mode ถูกปิดจากทุก application route แล้ว
- `/setup`, `/login` และ `/auth/*` เป็น public routes; application routes ต้องมี session
- ห้ามนำ secret key หรือ service role key ไปใส่ `NEXT_PUBLIC_*` หรือ client bundle

## 5. Data model และสิทธิ์

- `profiles.id` อ้างอิง `auth.users.id`
- `workspace_members` เป็นแหล่ง authorization หลัก ห้ามใช้ user-editable metadata ตัดสินสิทธิ์
- Project อยู่ใน Workspace
- Task/Subtask อยู่ตาราง `tasks` เดียวกันผ่าน `parent_task_id`
- Task fields หลัก: title, description, status, priority, assignee, start/due dates, position, deleted_at
- Admin: จัดการ Project, Member และ Task
- Member: จัดการ Task ตาม policy แต่ไม่จัดการโครงสร้าง Workspace/Project
- Guest: read-only ทั้ง UI และ RLS
- ทุก view ต้องอ่าน/แก้ task records ชุดเดียวกัน ห้ามสร้างตารางแยกตาม view

## 6. ไฟล์สำคัญ

### Product และ design

- `PRD.md`
- `DESIGN.md`
- `DEVELOPMENT_PLAN.md`
- `design-template/`

### Auth และ Supabase

- `src/proxy.ts` — Next.js Proxy entry point
- `src/lib/supabase/proxy.ts` — refresh/verify session และ route redirects
- `src/lib/supabase/server.ts` — Supabase server client
- `src/lib/supabase/client.ts` — browser client
- `src/lib/supabase/config.ts` — environment validation
- `src/app/login/` — login UI และ Server Action
- `src/app/onboarding/` — transactional first Workspace bootstrap
- `src/lib/workspace.ts` — authenticated Workspace/project loading
- `src/lib/tasks.ts` — task/member queries

### Project และ Task UI

- `src/app/projects/[projectId]/page.tsx` — project server page/view routing
- `src/components/project-view-tabs.tsx` — client-aware cross-view URL state
- `src/components/task-list-view.tsx` — List View และ shared Task Drawer
- `src/components/kanban-board.tsx` — Phase 3 Kanban
- `src/components/timeline-view.tsx` — Phase 4A Timeline vertical slice
- `src/components/gantt-view.tsx` — Phase 4 Gantt hierarchy/progress/windowing
- `src/app/tasks/actions.ts` — shared validated task mutations
- `src/lib/date-grid.ts` — shared Timeline/Gantt date calculation layer
- `src/lib/analytics.ts` — privacy allowlist สำหรับ product analytics
- `src/app/globals.css` — design tokens และ responsive styling
- `src/lib/types.ts` — shared application types

### Database

- `supabase/migrations/20260927034154_phase_1_foundation.sql`
- `supabase/migrations/20260927055345_phase_2_core_tasks.sql`
- `supabase/migrations/20260927163850_phase_5_foreign_key_indexes.sql`

## 7. วิธีรันและตรวจคุณภาพ

```bash
npm install
npm run dev
```

เปิด `http://localhost:3000` ระบบต้อง redirect ไป `/login` หากไม่มี session

Static checks:

```bash
npm run lint
npm run typecheck
npm run build
```

ผลตรวจล่าสุด:

- ESLint: ผ่าน
- TypeScript: ผ่าน
- Production build (`npm run build`, Turbopack): ผ่าน
- Build output แสดง `Proxy (Middleware)` แล้ว
- Unauthenticated request ไป Project: ได้ `307` ไป `/login` พร้อมเก็บ return path/query
- Login page desktop browser smoke test: ผ่าน ไม่มี console error
- Phase 3 browser smoke test desktop/mobile 375 px: ผ่าน
- Phase 4 + Phase 5 regression tests (`npm run test`): ผ่าน 9/9
- Dependency audit (`npm audit --omit=dev`): ผ่าน ไม่พบ vulnerability
- Remote Supabase schema lint (`npx supabase db lint --linked --level warning --fail-on error`): ผ่าน ไม่พบ schema error
- Supabase Advisors: missing foreign-key indexes แก้แล้ว; คงเหลือ INFO unused-index (ฐานข้อมูลยัง traffic ต่ำ) และ WARN ของ RPC SECURITY DEFINER ที่ตั้งใจเปิดพร้อม internal authorization กับ leaked-password protection ที่ต้องเปิดใน Dashboard
- RLS SQL suite: execute บน linked database ถึง assertion 17 สำเร็จและ rollback fixtures; formal `supabase test db` runner ยังรันไม่ได้เพราะเครื่องไม่มี Docker/Podman
- Playwright production E2E: Chromium/WebKit login gate ผ่าน; authenticated tests ถูก skip ตามตั้งใจเมื่อไม่มี credentials
- Firefox Playwright runtime เปิดไม่ได้บนเครื่องนี้ (`Could not find profile folder`) หลังลอง isolated ซ้ำแล้ว จึงต้อง rerun บน CI/เครื่องที่รองรับ
- Performance trace ยังไม่ได้รัน เพราะ environment ไม่มี Chrome DevTools MCP (`performance_start_trace`/`navigate_page`); ห้ามสรุป Core Web Vitals จากค่าคาดเดา
- Phase 4 unauthenticated login gate ที่ 375/768/1024/1440 px: ผ่าน Chromium/WebKit ไม่มี horizontal overflow และรักษา Gantt return URL
- Phase 5A login gate responsive verification ที่ 375/768/1024/1440 px: ผ่าน ไม่มี horizontal overflow หรือ console warning/error
- Authenticated Gantt cross-view browser test: ผ่าน โดยเลื่อนช่วงวันที่ 1 วัน, ตรวจ List/Kanban/Timeline แล้วคืนค่าเดิม; desktop 1440, tablet 768/1024 และ mobile 375 ไม่มี document overflow หรือ console warning/error
- Quick add, status change, Task Drawer, mobile tabs และ Kanban → List filter persistence: ผ่าน
- dnd-kit hydration mismatch ถูกแก้ด้วย stable `DndContext id`

## 8. ข้อควรระวังและสิ่งที่ยังขาด

- Repository directory ปัจจุบันไม่ได้เป็น Git repository (`git status` แจ้งว่าไม่พบ `.git`) อย่าสมมติว่ามี branch/commit history
- รอบ production/preview deployment ล่าสุดไม่ได้รัน lint, typecheck, automated tests, UAT หรือ browser verification ตามคำสั่งผู้ใช้ จึงต้องแยกผลตรวจเดิมออกจาก release sign-off ของ deployment ล่าสุด
- มี Node unit/regression, pgTAP RLS และ Playwright suites แล้ว แต่ authenticated Playwright execution และ local Docker pgTAP runner ยังรอ test credentials/runtime
- Pointer drag จริงยังไม่ได้ทำ automated E2E; ทดสอบ status alternative และ persistence paths แล้ว
- `src/lib/demo-data.ts` ยังอยู่เป็นไฟล์เก่า แต่ไม่มี application route ใช้งานแล้ว สามารถลบใน cleanup ภายหลัง
- Workspace จริงเพิ่งสร้าง จึงยังไม่มี Project/Task เริ่มต้น
- ก่อนเขียน Next.js code ต้องอ่าน guide ที่เกี่ยวข้องใน `node_modules/next/dist/docs/` ตาม `AGENTS.md`
- ก่อนทำ Supabase task ต้องตรวจ current docs/changelog และไม่เปิดเผย service role/secret keys
- อย่าเขียนทับ user changes ที่อยู่นอก scope

## 9. งานที่ยังเหลือก่อน release sign-off

สถานะปัจจุบันคือ **implementation และ deployment เสร็จแล้ว แต่ยังไม่ถือว่าผ่าน release sign-off** เพราะรอบ deployment ล่าสุดผู้ใช้สั่งให้ข้ามการทดสอบและ browser verification

1. Owner decisions — ห้ามตัดสินใจหรือก่อค่าใช้จ่ายแทนผู้ใช้:
   - จะอัปเกรด Vercel เพื่อเปิด Speed Insights หรือไม่
   - จะอัปเกรด Supabase เพื่อเปิด leaked-password protection และ backup/PITR หรือไม่
   - จะสร้าง Git repository และเชื่อม Vercel Git integration หรือไม่
   - จะใช้ custom domain หรือคง production alias ปัจจุบัน
2. เมื่อผู้ใช้อนุญาตให้ทดสอบ:
   - รัน lint, typecheck และ production build บน source ล่าสุด
   - รัน authenticated Playwright/UAT กับ local หรือ preview โดยส่ง credentials ผ่าน environment เท่านั้น
   - ตรวจ production/preview บน desktop และ mobile รวม login gate, Timeline/Gantt, mutations และ cross-view state
   - รัน pgTAP ผ่าน `supabase test db` ใน local/staging Supabase ที่พร้อม
   - รัน Firefox/Edge manual verification ตาม compatibility matrix
   - ตรวจ response security headers และยืนยันว่าไม่มี secret รั่วใน client bundle/logs
3. หลังอนุญาตให้เก็บข้อมูลจริง:
   - เก็บ Web Analytics และ field performance
   - ปิด defect ที่พบและบันทึกผลใน `OPERATIONS.md`/`HANDOFF.md`
   - ทำ release sign-off โดยระบุ environment, build/deployment และหลักฐานการตรวจรับ

### ผล verification ล่าสุด — 1 ตุลาคม 2026

- รัน `npm ci`, regression tests 9/9, lint, typecheck และ `npx next build --webpack` บน source ปัจจุบันแล้ว: ผ่านทั้งหมด และ build แสดง `Proxy (Middleware)`
- Local production login-gate E2E ผ่าน Chromium/WebKit ที่ 375, 768, 1024 และ 1440 px; authenticated tests 4 รายการถูก skip เพราะไม่มี credentials/mutation opt-in
- Production login-gate E2E ที่ `https://orange-cat-task-tracking.vercel.app` ผ่าน Chromium และ WebKit
- Preview URL ล่าสุดถูก Vercel Deployment Protection ครอบอยู่ ทั้ง Chromium/WebKit จึงเห็นหน้า `Log in to Vercel` ก่อนถึงแอป; ไม่ได้พยายาม bypass protection
- Local Firefox Playwright เปิด browser process ไม่สำเร็จด้วย `Could not find profile folder` ก่อนเริ่ม test จึงเป็น runtime blocker ของเครื่องนี้ ไม่ใช่ application assertion failure
- Production `/login` ส่ง security headers ที่กำหนดครบ
- Client static bundle secret-name scan ผ่าน และ `npm audit --omit=dev` รายงาน 0 vulnerabilities
- ยังไม่ได้รัน authenticated Admin/Member/Guest UAT, authenticated mutation/cross-view flow, formal pgTAP local/staging, Firefox/Edge/manual compatibility หรือ field-performance collection
- Release sign-off ยังไม่เสร็จ รายละเอียดผลและ outstanding gates อยู่ใน `OPERATIONS.md`

## 10. Prompt สำหรับเริ่มแชทใหม่

คัดลอกข้อความด้านล่างไปเริ่มแชทใหม่:

```text
ช่วยรับช่วงงานในโปรเจกต์ `/Users/pannavich/Documents/Task Tracking`

ก่อนเริ่ม ให้ทำตามลำดับนี้:
1. อ่าน `AGENTS.md` ทั้งหมดและปฏิบัติตาม โดยเฉพาะข้อกำหนดให้เปิดอ่าน Next.js guide ที่เกี่ยวข้องใน `node_modules/next/dist/docs/` ก่อนเขียน code
2. อ่าน `HANDOFF.md`, `PRD.md`, `DESIGN.md`, `OPERATIONS.md` และ Phase 5 ใน `DEVELOPMENT_PLAN.md`
3. ตรวจ implementation และ environment ปัจจุบันจริงก่อนแก้ โดยห้ามทำ Phase 1–5 ซ้ำหรือย้อนการเปลี่ยนแปลงเดิม
4. รักษา mandatory Supabase login gate, RLS, shared task records และ cross-view state ที่มีอยู่
5. ห้ามนำ password, service role key, access token, `VERCEL_OIDC_TOKEN` หรือ secret ใด ๆ ลง source code, client bundle, logs หรือเอกสาร และห้าม copy `.env.local`
6. โปรเจกต์นี้ยังไม่มี `.git`; อย่าคาดเดา branch/commit และอย่าสร้าง Git repository เว้นแต่ผู้ใช้สั่งชัดเจน

สถานะล่าสุด:
- Phase 1–4 เสร็จแล้ว
- Phase 5 implementation และ deployment เสร็จแล้ว: server-only guards, auth-boundary regression, Task Drawer accessibility, global error, UAT/runbook, pgTAP suite, Playwright suites, analytics privacy allowlist, FK indexes และ HTTP security headers
- Supabase project ref คือ `bbsgktwqdoaqkizjwztl`; migrations ทั้ง 3 applied แล้ว
- Vercel project คือ `pan-vich1/orange-cat-task-tracking`
- Production พร้อมใช้งานที่ `https://orange-cat-task-tracking.vercel.app`
- Preview ล่าสุดพร้อมใช้งานที่ `https://orange-cat-task-tracking-j2m73chzj-pan-vich1.vercel.app`
- Vercel environment variables สำหรับ Production/Preview/Development ตั้งแล้ว และ Web Analytics เปิดแล้ว
- Supabase Auth Site URL และ redirect allowlist รองรับ production, Vercel previews และ localhost แล้ว
- Speed Insights เปิดไม่ได้บน Vercel plan ปัจจุบัน และ leaked-password protection เปิดไม่ได้บน Supabase Free plan; ห้ามอัปเกรดหรือก่อค่าใช้จ่ายโดยไม่ได้รับอนุญาตชัดเจน
- ผล validation ก่อนหน้าผ่าน lint, typecheck, build, regression tests 9/9 และ `supabase db lint`
- รอบ deployment ล่าสุดจงใจไม่ได้รัน lint/typecheck/tests/UAT/browser verification ตามคำสั่งผู้ใช้ ดังนั้นระบบ deploy แล้วแต่ยังไม่ผ่าน release sign-off

งานถัดไป:
- อ่านหัวข้อ 9 ใน `HANDOFF.md` แล้วทำตาม priority ล่าสุดของผู้ใช้
- ถ้าผู้ใช้อนุญาตให้ทดสอบ ให้ทำ verification backlog และบันทึกผลจริง; ห้ามอ้างผลเก่าแทน source/deployment ล่าสุด
- ถ้าผู้ใช้ยังไม่อนุญาตให้ทดสอบ ให้ทำเฉพาะงานเอกสาร, owner decisions หรืองานที่ไม่ต้องอ้างผลตรวจรับ และระบุชัดว่า release sign-off ยังไม่เสร็จ
- อย่า redeploy หรือเปลี่ยน production โดยไม่จำเป็น และห้าม upgrade plan, ซื้อบริการ, สร้าง/หมุน secret หรือเปลี่ยน product behavior โดยไม่ได้รับอนุญาตชัดเจน
- ถ้าต้องแก้ code ให้ตรวจ shared mutation path เดิม เพื่อไม่สร้าง task records หรือ state ซ้ำ
```
