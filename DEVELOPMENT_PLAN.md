# แผนพัฒนา Task Tracking Web Application — MVP

อ้างอิงจาก [PRD](./PRD.md), [Design System](./DESIGN.md) และ design templates ทั้ง 6 หน้าจอใน `design-template/`

> สถานะ ณ 27 กันยายน 2026: Phase 1–3 พัฒนาใน repository แล้ว โดย Supabase project `trask-tracking` (Singapore) เชื่อมและ apply migrations เรียบร้อย Phase 3 เพิ่ม Kanban, drag-and-drop, quick add, mobile status tabs และ cross-view state บน task records ชุดเดียว พร้อมผ่าน lint, TypeScript, production build และ browser smoke test ทั้ง desktop/mobile

## 1. แนวทางและขอบเขต

เป้าหมายคือส่งมอบเว็บแอป Task Tracking สำหรับทีมประมาณ 10 คน โดยใช้ข้อมูล Task ชุดเดียวร่วมกันใน Kanban, List, Timeline และ Gantt มีสิทธิ์ Admin / Member / Guest ที่บังคับใช้ทั้ง UI และ Supabase RLS และรองรับ Desktop/Mobile ตาม PRD

Design template จะใช้เป็น visual reference สำหรับ application shell, sidebar, project navigation, view tabs, task cards, tables, timeline, Gantt และ task detail drawer แต่ฟีเจอร์ที่ปรากฏใน template และอยู่นอก PRD MVP จะยังไม่พัฒนา ได้แก่ Dashboard/Report, Sprint, Comments, Activity feed, Workload, Export, Google Calendar integration, Attachment และ Realtime live sync

## 2. สถาปัตยกรรมที่แนะนำ

- Frontend: Next.js App Router + TypeScript + Tailwind CSS
- UI primitives: Radix UI หรือ shadcn/ui โดยสร้าง theme จาก token ใน `DESIGN.md`
- Forms/validation: React Hook Form + Zod
- Data/Auth: Supabase Auth, PostgreSQL และ Row Level Security
- Server access: Supabase SSR client, Server Components สำหรับ initial read และ Server Actions/Route Handlers สำหรับ mutation
- Client state: URL search params สำหรับ view/filter/sort ที่แชร์ข้ามมุมมอง และ optimistic state เฉพาะ interaction ที่จำเป็น
- Drag/resize: dnd-kit สำหรับ Kanban; timeline/Gantt ใช้ date-grid interaction layer ร่วมกันเพื่อลด logic ซ้ำ
- Test: Vitest + Testing Library, Supabase database/RLS tests และ Playwright E2E
- Deploy/monitoring: Vercel Preview/Production + error monitoring เช่น Sentry

หลักสำคัญคือทุก View อ่านและแก้ `tasks` records ชุดเดียวกัน ไม่มีตารางแยกตาม View และ mutation ทุกจุดต้องผ่าน validation กับ permission ชุดเดียวกัน

## 3. แผนการพัฒนา 5 เฟส

### Phase 1 — Foundation, Auth และ Security

**เป้าหมาย:** วางฐานระบบที่รองรับ multi-tenant และป้องกันข้อมูลข้าม Workspace ตั้งแต่ต้น

งานหลัก:

- ตั้งค่า Next.js, TypeScript, lint/format, environment configuration และ Vercel Preview
- แปลง color, typography, spacing, radius และ elevation จาก `DESIGN.md` เป็น design tokens
- สร้าง responsive application shell: desktop sidebar, tablet overlay/icon rail, mobile navigation, project header และ view tabs
- สร้าง Supabase migrations สำหรับ `profiles`, `workspaces`, `workspace_members`, `projects`, `tasks`, enum, index, constraint และ trigger
- ทำ Auth แบบ Email/Password, Supabase SSR cookie session, protected routes, sign in/sign out และ onboarding สำหรับ Workspace แรก
- ทำ RLS/Grants สำหรับ Admin, Member, Guest และผู้ใช้นอก Workspace พร้อม automated allow/deny tests
- ทำ Project CRUD สำหรับ Admin และ project list สำหรับสมาชิกทุกบทบาท
- วาง error boundary, 403, 404, loading skeleton, toast และ modal confirmation primitives

ผลลัพธ์ที่ส่งมอบ:

- ผู้ใช้ sign in แล้วเข้าถึงได้เฉพาะ Workspace ของตน
- Admin สร้าง/แก้ไข/ลบ Project และจัดการโครงสร้าง Workspace ขั้นต้นได้
- Guest/Member ไม่สามารถเปลี่ยน Project ผ่าน UI หรือ API
- Application shell ตรงกับ design language และใช้งานได้ที่ 375, 768, 1024 และ 1440 px

Exit criteria:

- Migration สร้าง environment ใหม่ได้จาก repository
- RLS tests ผ่านครบทุก role รวม cross-workspace access
- ไม่มี secret/service role key ฝั่ง browser

### Phase 2 — Core Task Management, Members และ List View

**เป้าหมาย:** ทำ vertical slice ที่ใช้งานจริงได้ครบตั้งแต่สร้างงานจนแก้ไข/ลบ ก่อนเพิ่มมุมมองเชิงภาพ

งานหลัก:

- ทำ Team Management ตาม template เฉพาะส่วนใน MVP: รายชื่อ, invite/add by email, เปลี่ยน role, remove member และป้องกันการลบ Admin คนสุดท้าย
- ทำ Task/Subtask CRUD โดยใช้ตารางเดียวและ `parent_task_id`; จำกัด Subtask ลึก 1 ระดับ
- ทำ Task Detail Drawer ขนาด 540 px บน desktop และ full-screen บน mobile
- รองรับ Title, Description แบบ plain text, Status, Priority, Assignee, Start date, Due date และ Subtasks
- ทำ soft delete แบบ transaction รวม Task และลูก พร้อม confirmation
- ทำ List View: expand/collapse hierarchy, inline edit, sort, pagination/virtualization threshold และ mobile cards
- ทำ shared Search/Filter: title, status, assignee, priority, “งานของฉัน” และ clear all
- เก็บ view/filter/sort ใน URL หรือ user preference layer เพื่อคงค่าระหว่างเปลี่ยน View
- ทำ validation: due date ไม่ก่อน start date, assignee อยู่ Workspace เดียวกัน, parent/child อยู่ Project เดียวกัน
- ทำ optimistic update + rollback/error feedback สำหรับ inline edits

ผลลัพธ์ที่ส่งมอบ:

- Admin/Member จัดการ Task/Subtask ได้ครบจาก List และ Drawer
- Guest เปิดดูรายละเอียดได้แต่ไม่มี action แก้ไข และยิง mutation ตรงก็ถูก RLS ปฏิเสธ
- Search/filter/sort ให้ผลถูกต้องและ soft-deleted records ไม่แสดง

Exit criteria:

- Integration tests ผ่านสำหรับ CRUD, constraint, soft delete cascade และ permission
- List View รองรับ hierarchy และข้อมูล 1,000 งานโดยใช้ pagination/virtualization เมื่อเกิน 200 รายการ
- Flow สร้าง Task > เพิ่ม Subtask > แก้ field > ลบ ผ่าน E2E

### Phase 3 — Kanban และ Cross-view State

**เป้าหมาย:** เพิ่ม workflow ประจำวันและพิสูจน์ว่า View ต่าง ๆ ใช้ข้อมูลชุดเดียวกันจริง

งานหลัก:

- สร้าง Kanban 3 คอลัมน์: To do, In progress, Done
- สร้าง Task card ตาม design: priority, assignee, due date, overdue state และ subtask progress
- ทำ quick add ที่ท้ายคอลัมน์ และเปิด Drawer จาก card
- ทำ drag and drop เพื่อเปลี่ยน status/position พร้อม optimistic update, rollback และ keyboard alternative
- ทำ mobile segmented status tabs แทนการย่อ 3 คอลัมน์
- บังคับ read-only interaction สำหรับ Guest
- ทำ shared query/mutation invalidation ให้การเปลี่ยนใน Kanban สะท้อนใน List/Drawer หลัง revalidation
- เพิ่ม analytics events ขั้นพื้นฐานโดยไม่ส่ง title/description

ผลลัพธ์ที่ส่งมอบ:

- ทีมใช้ Kanban เป็น daily workflow ได้ทั้ง desktop และ mobile
- การเปลี่ยน status/field จาก Kanban, List หรือ Drawer อ่านค่าเดียวกันเสมอ

Exit criteria:

- Drag สำเร็จและคงค่าหลัง refresh; API fail แล้ว card กลับตำแหน่งเดิม
- Guest drag, quick add หรือ mutation ไม่ได้ทั้ง UI และ API
- Cross-view E2E tests ระหว่าง Kanban/List/Drawer ผ่าน

### Phase 4 — Timeline และ Gantt

**เป้าหมาย:** เพิ่มการวางแผนตามเวลาโดยใช้ date calculation และ interaction engine ร่วมกัน

งานหลัก:

- สร้าง date-grid utilities กลาง: week/month scale, visible range, today marker, date-to-pixel และ pixel-to-date
- ทำ Timeline สำหรับ Task หลัก, zoom Week/Month, horizontal scroll และ “ยังไม่กำหนดเวลา”
- รองรับ due-only เป็น milestone 1 วัน และ start-only เป็นแถบ 1 วันพร้อมคำแนะนำ
- ทำ drag/resize บน desktop และแก้วันที่ผ่าน Drawer บน mobile
- ทำ Gantt split view: sticky task table + time grid, Task/Subtask hierarchy, expand/collapse และ progress calculation
- แสดง Task/Subtask ที่ไม่มีวันในตารางแต่ไม่มี bar
- ใช้ virtualization/windowing สำหรับรายการใหญ่และจำกัด rendering ตาม visible date range
- ทำ cross-view consistency ระหว่าง Timeline, Gantt, List และ Drawer

ผลลัพธ์ที่ส่งมอบ:

- Timeline ใช้ดูภาพรวม Task หลัก และ Gantt ใช้วางแผน Task/Subtask แบบลำดับชั้นได้ชัดเจน
- การเปลี่ยนวันที่จาก View ใดสะท้อนในทุก View โดยไม่สร้างข้อมูลซ้ำ

Exit criteria:

- ไม่สามารถสร้างช่วงวันที่ที่ due date ก่อน start date
- Sticky task name และ horizontal scroll ทำงานบน desktop
- Mobile อ่าน timeline ได้และเข้าถึงรายการไม่มีวันได้ครบ
- Date interaction และ progress calculation ผ่าน unit/integration/E2E tests

### Phase 5 — Hardening, UAT และ Launch

**เป้าหมาย:** ปิดช่องว่างด้านคุณภาพ ความปลอดภัย ประสิทธิภาพ และความพร้อมใช้งานจริง

งานหลัก:

- ทำ responsive polish ทุกหน้าที่ 375, 768, 1024 และ 1440 px
- ตรวจ WCAG 2.2 AA: keyboard navigation, focus state, semantic labels, screen reader smoke test และไม่ใช้สีอย่างเดียวสื่อสถานะ
- ทดสอบ Chrome, Edge, Safari, Firefox และ mobile browsers ตาม PRD
- ปรับ performance ให้มี skeleton เร็ว, optimistic feedback ภายในประมาณ 100 ms และ LCP เป้าหมายไม่เกิน 2.5 วินาทีที่ p75
- ทำ security review: RLS regression, input validation, rate limit จุดเสี่ยง, dependency scan และ log redaction
- ตั้ง error monitoring, production environment, backup/rollback procedure และ release checklist
- ทำ UAT ตาม persona Admin/Member/Guest และแก้ defect ระดับ Critical/High ทั้งหมด
- ตรวจ analytics events และ success metrics สำหรับ pilot 30 วัน

ผลลัพธ์ที่ส่งมอบ:

- Production-ready MVP บน Vercel + Supabase
- Test report, UAT sign-off, operational runbook และ rollback procedure

Exit criteria:

- Acceptance criteria ระดับ MVP ผ่านครบ
- Cross-view consistency 100% ใน test suite
- Guest mutation ถูกปฏิเสธ 100% ใน permission suite
- ไม่มี Critical/High defect เปิดค้าง

## 4. ลำดับ Dependency

```text
Schema/Auth/RLS
      ↓
Workspace/Project/Members
      ↓
Task CRUD + Drawer + Shared filters
      ↓
List View ──→ Kanban
      ↓          ↓
Shared date-grid/data consistency layer
      ↓
Timeline ──→ Gantt
      ↓
Security/Performance/UAT/Launch
```

ไม่ควรเริ่ม Gantt ก่อน Task hierarchy, shared date utilities และ List View มีเสถียรภาพ เพราะ Gantt รวมความเสี่ยงด้าน hierarchy, date interaction, sticky layout และ performance ไว้พร้อมกัน

## 5. Timeline โดยประมาณ

ประเมินเป็น 8–10 สัปดาห์สำหรับทีมขนาดเล็กที่มี Frontend 1 คน, Full-stack/Backend 1 คน และ QA/Design แบบ part-time:

| เฟส | ระยะเวลาโดยประมาณ |
|---|---:|
| Phase 1 — Foundation, Auth, Security | 2 สัปดาห์ |
| Phase 2 — Core Task, Members, List | 2–2.5 สัปดาห์ |
| Phase 3 — Kanban, Cross-view State | 1–1.5 สัปดาห์ |
| Phase 4 — Timeline, Gantt | 2–2.5 สัปดาห์ |
| Phase 5 — Hardening, UAT, Launch | 1.5–2 สัปดาห์ |

หากมีผู้พัฒนาเพียง 1 คน ควรเผื่อประมาณ 12–16 สัปดาห์ โดยไม่ลดเวลาทดสอบ RLS และ cross-view consistency

## 6. สิ่งที่ต้องตัดสินใจก่อนเริ่ม Phase 1

1. Invitation รุ่นแรกจะส่ง email link จริง หรือให้ Admin เพิ่มเฉพาะ email ที่สมัครแล้วตามทางเลือกใน PRD
2. ยืนยันว่า Workspace รุ่นแรกมีเพียงหนึ่ง Workspace ต่อผู้ใช้ใน UI แม้ schema รองรับหลาย Workspace
3. ยืนยันว่า Member แก้ไขและลบ Task ของทุกคนได้ และ Guest เห็นทุก Project ใน Workspace
4. ยืนยัน retention ของ soft-deleted Task อย่างน้อย 30 วัน และกำหนดผู้รับผิดชอบการกู้คืนแบบ manual
5. ยืนยันว่า Description ใน MVP เป็น plain text ไม่ใช่ rich text แม้ design template จะมีลักษณะคล้าย rich content
6. ยืนยันว่า Dashboard, Sprint, Comments, Activity, Workload, Export และ integration ต่าง ๆ ไม่เข้ารอบ MVP

## 7. Release slices ที่เดโมได้

- Demo 1: Sign in > สร้าง Workspace/Project > ตรวจสิทธิ์ 3 role
- Demo 2: สร้าง Task/Subtask > แก้จาก List/Drawer > Filter/Sort > Soft delete
- Demo 3: ลาก Kanban > เปิด Drawer > ตรวจข้อมูลใน List
- Demo 4: ปรับวันที่ใน Timeline/Gantt > ตรวจผลข้ามทั้ง 4 Views
- Release Candidate: Responsive, accessibility, performance, security และ UAT ครบ
