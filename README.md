# Orange Cat Task Tracking

Phase 1–4 และ Phase 5 hardening foundation ของ Task Tracking Web Application ตาม `PRD.md` และ `DEVELOPMENT_PLAN.md`

สำหรับส่งต่องานไปยังแชทหรือผู้พัฒนาคนถัดไป ให้อ่าน `HANDOFF.md` ก่อนเริ่มแก้ไข

Production deployment: https://orange-cat-task-tracking.vercel.app

## สิ่งที่พร้อมใช้งาน

- Next.js App Router + TypeScript + Tailwind CSS
- Responsive application shell สำหรับ Desktop, Tablet และ Mobile
- Supabase SSR Auth ด้วย cookie session และ `proxy.ts`
- Sign in / Sign out และ onboarding สำหรับ Workspace แรก
- Schema สำหรับ Profile, Workspace, Membership, Project และ Task/Subtask
- Workspace-scoped RLS สำหรับ Admin, Member, Guest และผู้ใช้นอก Workspace
- Project create, read, update และ delete สำหรับ Admin
- Team Management: เพิ่มผู้ใช้ที่สมัครแล้วด้วยอีเมล เปลี่ยนบทบาท และนำสมาชิกออก
- Task/Subtask CRUD, soft delete และ Task Detail Drawer
- List View พร้อม hierarchy, inline edit และ responsive mobile cards
- Kanban 3 สถานะ พร้อม drag-and-drop, keyboard alternative, quick add และ mobile status tabs
- Task card แสดง priority, assignee, due/overdue และความคืบหน้างานย่อย
- Search/filter/sort, งานของฉัน, URL-persisted filters และ progressive rendering สำหรับรายการขนาดใหญ่
- Timeline พร้อม Week/Month zoom, milestone/start-only, undated bucket และ desktop drag/resize
- Gantt split view พร้อม Task/Subtask hierarchy, progress, responsive list/chart toggle และ windowing เมื่อเกิน 200 แถว
- Cross-view state ระหว่าง Kanban, List, Timeline, Gantt และ Drawer ผ่าน task records ชุดเดียว พร้อม optimistic update และ rollback/error feedback
- Guest read-only, Vercel Web Analytics/Speed Insights และ analytics events แบบ allowlist ที่ไม่ส่ง title/description/ID
- HTTP security headers สำหรับ HSTS, content-type sniffing, clickjacking, referrer และ browser permissions
- Loading, error, 403 และ 404 states
- บังคับเข้าสู่ระบบด้วย Supabase Auth ก่อนเข้าถึง Workspace, Project, Members และ Task ทุกหน้า

## เริ่มใช้งานบนเครื่อง

```bash
npm install
npm run dev
```

เปิด `http://localhost:3000` ระบบจะส่งไปหน้า Sign in ก่อนเข้าใช้งาน หากยังไม่มี `.env.local` ระบบจะเปิดหน้า Setup เท่านั้นและไม่อนุญาตให้ข้ามเข้าแอปด้วยข้อมูลตัวอย่าง

## เชื่อม Supabase

1. สร้าง Supabase project
2. Link project และตรวจ migration ก่อน apply

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run
npx supabase db push
```

3. สร้าง `.env.local` จาก `.env.example`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

4. สร้างผู้ใช้ Email/Password จาก Supabase Auth แล้ว restart development server

ระบบจะพาผู้ใช้ที่ยังไม่มี membership ไปสร้าง Workspace และตั้งเป็น Admin คนแรกแบบ transaction เดียว

> ใช้เฉพาะ Publishable key ในตัวแปร `NEXT_PUBLIC_` ห้ามใส่ Secret key หรือ service role key ฝั่ง Browser

## ตรวจคุณภาพ

```bash
npm run lint
npm run typecheck
npm run build
npm test
npm run test:e2e
```

โปรเจกต์ Supabase `trask-tracking` เชื่อมแล้วใน region Singapore และ apply migrations ของ Phase 1–2 กับ Phase 5 foreign-key indexes เรียบร้อย ปัจจุบัน migration ครอบคลุมการป้องกัน Admin คนสุดท้าย, validation ของ Task relation/date, member lookup แบบ Security Definer, soft delete Task พร้อม Subtask และ covering indexes สำหรับ foreign keys
