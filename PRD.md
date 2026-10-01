# Product Requirements Document (PRD)

## Task Tracking Web Application — MVP

| รายการ | รายละเอียด |
|---|---|
| เวอร์ชันเอกสาร | 1.0 |
| สถานะ | Draft สำหรับตรวจสอบ |
| วันที่ | 20 กันยายน 2026 |
| กลุ่มผู้ใช้หลัก | Project team ขนาดประมาณ 10 คน |
| แพลตฟอร์ม | Web application สำหรับ Desktop และ Mobile Responsive |
| Frontend / Hosting | Next.js (App Router) บน Vercel |
| Backend / Database / Auth | Supabase |

---

## 1. บทสรุปผลิตภัณฑ์

Task Tracking Web Application เป็นเว็บแอปสำหรับทีมโครงการขนาดเล็กประมาณ 10 คน ใช้สร้าง จัดระเบียบ และติดตาม Task/Subtask ภายในโครงสร้างที่เรียบง่าย ได้แก่ `Workspace > Project > Task > Subtask`

ผู้ใช้สามารถดูข้อมูลงานชุดเดียวกันผ่าน 4 มุมมอง ได้แก่:

1. **Kanban Board** — ติดตามการไหลของงานตามสถานะ
2. **List View** — ดูและจัดการรายละเอียดงานในรูปแบบรายการ
3. **Timeline View** — เห็นภาพรวมงานตามช่วงเวลาอย่างกระชับ
4. **Gantt Chart** — เห็นลำดับชั้นและระยะเวลาของ Task/Subtask ในรูปแบบตารางควบคู่กับแถบเวลา

ระบบเน้นความง่ายในการเรียนรู้ การเปลี่ยนมุมมองโดยไม่ทำให้ข้อมูลซ้ำ และสิทธิ์ผู้ใช้ 3 ระดับ ได้แก่ Admin, Member และ Guest

---

## 2. ที่มาและปัญหาที่ต้องการแก้

ทีมโครงการขนาดเล็กมักติดตามงานผ่านหลายช่องทาง เช่น Spreadsheet, แชต และเอกสาร ทำให้เกิดปัญหา:

- ไม่ทราบสถานะล่าสุดของงาน
- ข้อมูลวันเริ่มและกำหนดส่งกระจัดกระจาย
- ไม่เห็นความสัมพันธ์ระหว่าง Task กับ Subtask
- ผู้ใช้แต่ละบทบาทเข้าถึงหรือแก้ไขข้อมูลเกินความจำเป็น
- การดูงานแบบรายการอย่างเดียวไม่ตอบโจทย์ทั้งการทำงานประจำวันและการวางแผนเวลา

ผลิตภัณฑ์นี้จะทำหน้าที่เป็นแหล่งข้อมูลกลางของงานในแต่ละ Project และให้ผู้ใช้เลือกมุมมองที่เหมาะกับงานของตน โดยข้อมูลที่แก้จากมุมมองหนึ่งต้องสะท้อนในทุกมุมมอง

---

## 3. เป้าหมายของ MVP

### 3.1 เป้าหมายหลัก

- ให้ทีมสร้าง แก้ไข และลบ Task/Subtask ได้จากระบบเดียว
- ให้ทีมดูงานชุดเดียวกันผ่าน Kanban, List, Timeline และ Gantt
- ให้ผู้ใช้เข้าใจสถานะ ผู้รับผิดชอบ และกรอบเวลาของงานได้รวดเร็ว
- ควบคุมสิทธิ์ตาม Workspace ด้วยบทบาท Admin, Member และ Guest
- รองรับการใช้งานหลักบน Desktop และใช้งานที่จำเป็นได้บน Mobile
- ใช้สถาปัตยกรรมที่ดูแลไม่ซับซ้อน โดยเก็บข้อมูลและยืนยันตัวตนผ่าน Supabase และ Deploy บน Vercel

### 3.2 ตัวชี้วัดความสำเร็จเบื้องต้น

ภายใน 30 วันหลังเปิดใช้กับทีมทดลอง:

- สมาชิกอย่างน้อย 80% เข้ามาใช้งานอย่างน้อยสัปดาห์ละ 2 ครั้ง
- อย่างน้อย 90% ของงานที่กำลังดำเนินการมี Status และ Due date
- ผู้ใช้สร้างหรืออัปเดต Task สำเร็จโดยไม่ต้องขอความช่วยเหลืออย่างน้อย 90% ของกรณีทดสอบ
- การเปลี่ยนมุมมองไม่สร้าง Task ซ้ำ และข้อมูลสำคัญตรงกัน 100% ระหว่างทั้ง 4 มุมมอง
- Guest ไม่สามารถเปลี่ยนแปลงข้อมูลผ่าน UI หรือ API ได้ 100% ตามชุดทดสอบสิทธิ์

---

## 4. ขอบเขตผลิตภัณฑ์

### 4.1 อยู่ในขอบเขต MVP

- Sign in / Sign out ด้วย Email และ Password
- Workspace เดียวรองรับสมาชิกหลายคน
- สร้าง แก้ไข และลบ Project
- เชิญและจัดการสมาชิก Workspace
- บทบาท Admin, Member และ Guest
- สร้าง แก้ไข และลบ Task/Subtask
- ฟิลด์พื้นฐานของ Task และ Subtask
- 4 มุมมอง: Kanban, List, Timeline และ Gantt
- Filter และ Sort ขั้นพื้นฐาน
- Responsive layout สำหรับ Desktop และ Mobile
- การยืนยันก่อนลบ และ Soft delete สำหรับ Task/Subtask
- Empty state, Loading state, Error state และ Permission denied state

### 4.2 อยู่นอกขอบเขต MVP

- Dependency ระหว่าง Task, Critical path และ Auto scheduling
- Comment, Mention, Activity feed และไฟล์แนบ
- Notification ทางอีเมลหรือ Push notification
- Time tracking, Timesheet และ Billing
- Sprint, Backlog, Story point และ Agile report
- Custom field และ Custom workflow ต่อ Project
- Dashboard, Report และ Workload/capacity planning
- Calendar View
- Import/Export CSV
- Public sharing link
- Integration กับ Slack, Google Calendar, GitHub หรือบริการอื่น
- Offline mode และ Native mobile application
- หลาย Workspace ต่อบัญชีใน UI รุ่นแรก

> หมายเหตุ: โครงสร้างฐานข้อมูลควรรองรับหลาย Workspace ตั้งแต่ต้น แม้ UI รุ่นแรกจะพาผู้ใช้เข้า Workspace หลักเพียงแห่งเดียว เพื่อไม่ต้องย้ายข้อมูลครั้งใหญ่เมื่อผลิตภัณฑ์เติบโต

---

## 5. ผลการศึกษาผลิตภัณฑ์ที่คล้ายกัน

### 5.1 Asana

Asana ใช้แนวคิดให้ผู้ใช้สลับระหว่าง List, Board, Timeline และ Gantt บนข้อมูล Project เดียวกัน โดย Board แสดงงานเป็นการ์ดตามขั้นตอน ส่วน Timeline/Gantt ช่วยมองช่วงเวลาและอุปสรรคในการส่งมอบ แนวทางที่ควรนำมาใช้คือการสลับ View ได้ทันทีและการลากเพื่อปรับสถานะหรือวันที่โดยไม่ต้องเปิดหน้าใหม่ ([Asana — Project Views](https://asana.com/product/timeline))

### 5.2 Linear

Linear ให้ Board และ List มีพฤติกรรมใกล้เคียงกัน รวมถึงใช้ตัวเลือก Filter, Group และ Order ร่วมกัน อีกทั้งมีการบันทึกค่าการแสดงผลเป็นค่าของผู้ใช้หรือค่าเริ่มต้นของ Workspace แนวทางที่เหมาะกับ MVP คือทำ Filter/Sort ให้คงอยู่เมื่อสลับ View และรักษารูปแบบการโต้ตอบให้สม่ำเสมอ ([Linear — Display options](https://linear.app/docs/display-options), [Linear — Board layout](https://linear.app/docs/board-layout))

### 5.3 Jira

Jira แยก “พื้นที่เก็บงาน” ออกจาก “มุมมองของงาน” อย่างชัดเจน และทุก View อ่านจาก Work item ชุดเดียวกัน Board เหมาะกับการติดตามสถานะ ส่วน Timeline เหมาะกับการวางแผนแบบเบาภายใน Project เดียว แนวทางนี้สอดคล้องกับ MVP ที่ต้องการโครงสร้างน้อยและยังไม่ต้องมี Portfolio planning ([Jira — Features](https://www.atlassian.com/software/jira/features), [Jira — Timeline guide](https://www.atlassian.com/software/jira/guides/basic-roadmaps/overview), [Jira — Board guide](https://www.atlassian.com/software/jira/guides/boards/overview))

### 5.4 ClickUp

ClickUp มี List, Board และ Gantt เป็นมุมมองของ Task และใช้ Gantt สำหรับการวางแผนระยะเวลาและกำหนดส่ง สิ่งที่ควรนำมาใช้คือการแสดงรายละเอียดตามความเหมาะสมของแต่ละ View โดยไม่เพิ่มชนิดข้อมูลใหม่ ([ClickUp — Task views](https://help.clickup.com/hc/en-us/articles/6310383076503-Task-views))

### 5.5 ข้อสรุปเชิงผลิตภัณฑ์

- ใช้ Task record ชุดเดียวเป็น Single source of truth สำหรับทั้ง 4 Views
- เปลี่ยน View ผ่าน Tab ด้านบนของ Project
- ใช้สถานะเริ่มต้นเพียง 3 ค่า: `To do`, `In progress`, `Done`
- Timeline เน้นภาพรวมตามเวลา ส่วน Gantt เน้นรายละเอียดเชิงตาราง ลำดับชั้น และแถบช่วงเวลา
- ทำ Drag and drop เฉพาะจุดที่ให้ประโยชน์ชัดเจน ได้แก่ เปลี่ยน Status บน Kanban และปรับช่วงวันที่บน Timeline/Gantt
- หลีกเลี่ยง Customization ขั้นสูงใน MVP เพื่อให้ทีมเริ่มใช้งานได้ทันที

---

## 6. กลุ่มผู้ใช้และบทบาท

### 6.1 Persona หลัก

**Project Admin / Project Lead**

- สร้าง Project และจัดการสมาชิก
- วางแผนงานและติดตามภาพรวม
- ต้องการเห็นงานล่าช้า งานที่ไม่มีผู้รับผิดชอบ และสถานะของทีม

**Team Member**

- สร้างและอัปเดต Task/Subtask
- เปลี่ยนสถานะและกำหนดวันทำงาน
- ต้องการค้นหางานของตนและอัปเดตได้รวดเร็ว

**Guest / Stakeholder**

- ดูความคืบหน้าโดยไม่แก้ไขข้อมูล
- ต้องการเข้าถึงทุก View เพื่อเข้าใจภาพรวมและกำหนดส่ง

### 6.2 ตารางสิทธิ์

| ความสามารถ | Admin | Member | Guest |
|---|:---:|:---:|:---:|
| ดู Workspace และ Project ที่เป็นสมาชิก | ✓ | ✓ | ✓ |
| ดูทั้ง 4 Views | ✓ | ✓ | ✓ |
| สร้าง/แก้ไข/ลบ Project | ✓ | – | – |
| เชิญ ลบสมาชิก หรือเปลี่ยนบทบาท | ✓ | – | – |
| สร้าง Task/Subtask | ✓ | ✓ | – |
| แก้ไข Task/Subtask | ✓ | ✓ | – |
| เปลี่ยนสถานะ/วันที่ด้วย Drag and drop | ✓ | ✓ | – |
| ลบ Task/Subtask | ✓ | ✓ | – |
| กู้คืนข้อมูลที่ถูกลบ | ระยะถัดไป | – | – |

กฎสำคัญ:

- Guest ต้องเป็น Read-only ทั้งใน UI และฐานข้อมูล
- ระบบต้องตรวจสิทธิ์ที่ Supabase Row Level Security (RLS) ไม่พึ่งการซ่อนปุ่มใน UI เพียงอย่างเดียว
- Workspace ต้องมี Admin อย่างน้อย 1 คนเสมอ
- Member แก้ไข Task/Subtask ทุกชิ้นใน Workspace ได้ เพื่อให้เหมาะกับทีมขนาดเล็กและลดความซับซ้อนของ MVP

---

## 7. Information Architecture

```text
Sign in
└── Workspace
    ├── Project list
    ├── Members (Admin only)
    └── Project
        ├── Kanban
        ├── List
        ├── Timeline
        ├── Gantt
        └── Task detail drawer
            └── Subtasks
```

Desktop ใช้ Sidebar สำหรับ Project และ Top tab สำหรับ 4 Views ส่วน Mobile ใช้ Top bar, Project picker และ View selector แบบเลื่อนแนวนอนหรือ Dropdown

---

## 8. แบบจำลองข้อมูลเชิงธุรกิจ

### 8.1 Workspace

| ฟิลด์ | รายละเอียด |
|---|---|
| Name | ชื่อ Workspace; บังคับกรอก สูงสุด 100 ตัวอักษร |
| Created by | ผู้สร้าง Workspace |
| Created at / Updated at | วันเวลาสร้างและแก้ไขล่าสุด |

### 8.2 Workspace Member

| ฟิลด์ | รายละเอียด |
|---|---|
| User | อ้างอิงผู้ใช้จาก Supabase Auth |
| Workspace | Workspace ที่สังกัด |
| Role | `admin`, `member`, `guest` |
| Joined at | วันที่เข้าร่วม |

### 8.3 Project

| ฟิลด์ | รายละเอียด |
|---|---|
| Name | ชื่อ Project; บังคับกรอก สูงสุด 120 ตัวอักษร |
| Description | รายละเอียดแบบข้อความ สูงสุด 2,000 ตัวอักษร |
| Color | สีประจำ Project จากชุดสีที่ระบบกำหนด |
| Created by | ผู้สร้าง Project |
| Created at / Updated at | วันเวลาสร้างและแก้ไขล่าสุด |

### 8.4 Task/Subtask

ใช้ตารางเดียวกัน โดย Subtask คือ Task ที่มี `parent_task_id`

| ฟิลด์ | ชนิด/กฎ |
|---|---|
| Title | บังคับกรอก สูงสุด 200 ตัวอักษร |
| Description | ข้อความ สูงสุด 10,000 ตัวอักษร |
| Type | คำนวณจาก `parent_task_id`: Task หรือ Subtask |
| Status | `todo`, `in_progress`, `done`; ค่าเริ่มต้น `todo` |
| Priority | `low`, `medium`, `high`; ไม่บังคับ |
| Assignee | สมาชิก 1 คนใน Workspace; ไม่บังคับ |
| Start date | วันที่เริ่ม; ไม่บังคับ |
| Due date | กำหนดส่ง; ไม่บังคับ |
| Position | ลำดับภายใน Status/List สำหรับ Drag and drop |
| Parent task | ว่างสำหรับ Task หลัก; บังคับสำหรับ Subtask |
| Created by | ผู้สร้างรายการ |
| Created at / Updated at | วันเวลาสร้างและแก้ไขล่าสุด |
| Deleted at | ใช้ Soft delete; ปกติเป็นค่าว่าง |

กฎข้อมูล:

- `Due date` ต้องไม่ก่อน `Start date`
- Subtask อยู่ได้เพียง 1 ระดับ ไม่อนุญาต Subtask ซ้อน Subtask ใน MVP
- Task หลักและ Subtask ต้องอยู่ Project เดียวกัน
- Assignee ต้องเป็นสมาชิก Workspace เดียวกับ Project
- เมื่อลบ Task หลัก ระบบ Soft delete Subtask ทั้งหมดของ Task นั้นด้วย
- Task ที่ไม่มี Start/Due date ต้องอยู่ในกลุ่ม “ยังไม่กำหนดเวลา” ของ Timeline และ Gantt
- สถานะ Task หลักไม่เปลี่ยนอัตโนมัติตาม Subtask ใน MVP แต่แสดงจำนวน Subtask ที่เสร็จแล้ว

---

## 9. Functional Requirements

### 9.1 Authentication และ Session

| ID | Requirement |
|---|---|
| AUTH-01 | ผู้ใช้ Sign in ด้วย Email และ Password ได้ |
| AUTH-02 | ผู้ใช้ Sign out ได้จากเมนูบัญชี |
| AUTH-03 | ผู้ที่ยังไม่ Sign in และเปิด URL ภายในระบบต้องถูกส่งไปหน้า Sign in |
| AUTH-04 | Session ต้องใช้งานร่วมกับการ Render ฝั่ง Server และ Client ได้ |
| AUTH-05 | ข้อความผิดพลาดต้องไม่เปิดเผยว่าบัญชีใดมีอยู่ในระบบเกินความจำเป็น |

### 9.2 Workspace และสมาชิก

| ID | Requirement |
|---|---|
| WS-01 | ระบบสร้าง Workspace เริ่มต้นให้ Admin ในขั้นตอนเริ่มใช้งานครั้งแรก |
| WS-02 | Admin ดูรายชื่อสมาชิก บทบาท และ Email ได้ |
| WS-03 | Admin เชิญสมาชิกด้วย Email และกำหนดบทบาทได้ |
| WS-04 | Admin เปลี่ยนบทบาท Member/Guest ได้ |
| WS-05 | Admin นำสมาชิกออกได้ แต่ไม่สามารถนำ Admin คนสุดท้ายออก |
| WS-06 | Member และ Guest ดูรายชื่อสมาชิกสำหรับใช้เป็น Assignee ได้ แต่แก้ไขไม่ได้ |

> หากต้องลดระยะพัฒนา Invitation ในรอบแรก สามารถใช้ Admin เพิ่มผู้ใช้ที่สมัครแล้วด้วย Email ก่อน และเลื่อน Email invitation link ไปเป็นรุ่น 1.1

### 9.3 Project

| ID | Requirement |
|---|---|
| PRJ-01 | Admin สร้าง Project โดยกำหนด Name, Description และ Color ได้ |
| PRJ-02 | ผู้ใช้ทุกบทบาทเห็น Project ที่อยู่ใน Workspace ของตน |
| PRJ-03 | Admin แก้ไขข้อมูล Project ได้ |
| PRJ-04 | Admin ลบ Project ได้หลังยืนยันชื่อ Project หรือยืนยันใน Modal |
| PRJ-05 | เมื่อเปิด Project ระบบเปิด View ล่าสุดของผู้ใช้นั้น หรือ Kanban เป็นค่าเริ่มต้น |
| PRJ-06 | เมื่อเปลี่ยน View ระบบคง Filter และ Search ที่ใช้ร่วมกันได้ |

### 9.4 Task และ Subtask

| ID | Requirement |
|---|---|
| TSK-01 | Admin/Member สร้าง Task แบบ Quick add โดยใช้ Title อย่างเดียวได้ |
| TSK-02 | Admin/Member แก้ไข Title, Description, Status, Priority, Assignee, Start date และ Due date ได้ |
| TSK-03 | Admin/Member เพิ่ม Subtask จาก Task detail ได้ |
| TSK-04 | Admin/Member แก้ไขและลบ Subtask ได้ |
| TSK-05 | Admin/Member ลบ Task ได้หลังยืนยัน และระบบต้อง Soft delete Task/Subtask |
| TSK-06 | Guest เปิด Task detail และดู Subtask ได้ แต่ไม่เห็น Action สำหรับแก้ไขหรือลบ |
| TSK-07 | คลิก Task จากทุก View แล้วเปิด Task detail drawer โดยไม่ออกจาก View ปัจจุบัน |
| TSK-08 | หลังบันทึก การเปลี่ยนแปลงต้องปรากฏในทุก View โดยไม่ต้องสร้างข้อมูลใหม่ |
| TSK-09 | หากบันทึกล้มเหลว UI ต้องคืนค่าก่อนหน้าและแจ้งสาเหตุที่ผู้ใช้เข้าใจได้ |
| TSK-10 | แสดงจำนวน Subtask ที่เสร็จแล้ว เช่น `2/4` บน Task หลัก |

### 9.5 Search, Filter และ Sort

| ID | Requirement |
|---|---|
| FLT-01 | ค้นหาจาก Title ของ Task/Subtask ภายใน Project ได้ |
| FLT-02 | Filter ตาม Status, Assignee และ Priority ได้ |
| FLT-03 | มีตัวเลือก “งานของฉัน” เพื่อแสดง Task/Subtask ที่ผู้ใช้เป็น Assignee |
| FLT-04 | ล้าง Filter ทั้งหมดได้ด้วยคำสั่งเดียว |
| FLT-05 | List View Sort ตาม Created date, Updated date, Start date และ Due date ได้ |
| FLT-06 | Filter ที่กำลังใช้ต้องแสดงเป็น Chip หรือข้อความที่มองเห็นชัดเจน |

---

## 10. ข้อกำหนดของแต่ละ View

### 10.1 Kanban Board

วัตถุประสงค์: ติดตามการไหลของ Task หลักตามสถานะ

- มี 3 คอลัมน์: To do, In progress และ Done
- แสดง Task หลักเป็น Card; Subtask ไม่แยกเป็น Card เพื่อไม่ให้ Board แน่นเกินไป
- Card แสดง Title, Priority, Assignee, Due date และ Subtask progress
- Admin/Member ลาก Card ข้ามคอลัมน์เพื่อเปลี่ยน Status ได้
- Admin/Member Quick add Task ที่ท้ายคอลัมน์ได้ โดย Task ใช้ Status ของคอลัมน์นั้น
- Guest เห็น Card และเปิดรายละเอียดได้ แต่ลากหรือ Quick add ไม่ได้
- เมื่อหน้าจอ Desktop คอลัมน์แสดงข้างกันและเลื่อนแนวนอนได้หากพื้นที่ไม่พอ
- เมื่อ Mobile แสดงทีละคอลัมน์ผ่าน Status tab เพื่อหลีกเลี่ยงการ์ดที่แคบเกินไป
- Task ที่ Due date ผ่านแล้วและยังไม่ Done แสดงสถานะ Overdue อย่างชัดเจน

Acceptance Criteria:

- การลาก Task ไปคอลัมน์ใหม่อัปเดต Status และคงอยู่หลัง Refresh
- หาก API ล้มเหลว Card กลับตำแหน่งเดิมและแสดง Error toast
- Guest ไม่สามารถแก้ Status แม้ส่งคำขอโดยตรงไปยัง API

### 10.2 List View

วัตถุประสงค์: ดูรายละเอียดจำนวนมากและแก้ไขงานอย่างรวดเร็ว

- Desktop แสดงคอลัมน์ Title, Status, Priority, Assignee, Start date และ Due date
- Task สามารถ Expand/Collapse เพื่อแสดง Subtask แบบเยื้องใต้ Task หลัก
- Admin/Member แก้ไขฟิลด์พื้นฐานแบบ Inline ได้ ยกเว้น Description ซึ่งแก้ใน Drawer
- รองรับ Sort และ Filter ตามข้อ 9.5
- Mobile แสดงเป็นรายการ Card แบบกะทัดรัด โดยมี Title, Status, Assignee และ Due date เป็นข้อมูลหลัก
- มีปุ่ม Add task ที่มองเห็นได้ชัดเจน
- รายการที่ Soft delete แล้วไม่แสดงในการใช้งานปกติ

Acceptance Criteria:

- การเปิด/ปิด Task แสดง Subtask ที่สัมพันธ์กันถูกต้อง
- Inline edit มี Loading/Success/Error feedback
- การ Sort ไม่แก้ข้อมูลต้นฉบับหรือ `position` เว้นแต่ผู้ใช้เลือกเรียงแบบ Manual

### 10.3 Timeline View

วัตถุประสงค์: ให้ทีมเห็นภาพรวมว่างานใดเกิดขึ้นเมื่อใด โดยเน้นความเรียบง่ายมากกว่าโครงสร้างเชิงลึก

- แสดง Task หลักเป็นแถบบนแกนเวลา
- เลือก Zoom แบบ Week หรือ Month ได้
- สีของแถบอิง Status; แสดงชื่อ Task บนหรือข้างแถบ
- Admin/Member ลากทั้งแถบเพื่อเลื่อนช่วงเวลา หรือยืดขอบเพื่อเปลี่ยน Start/Due date ได้บน Desktop
- Mobile เป็น Read-optimized: เลื่อนแนวนอน เปิดรายละเอียดได้ และแก้วันที่ผ่าน Drawer แทนการ Resize ด้วยนิ้ว
- Subtask ไม่แสดงเป็นแถบแยกตามค่าเริ่มต้น แต่แสดงใน Task drawer
- มีส่วน “ยังไม่กำหนดเวลา” สำหรับ Task ที่ไม่มีวันที่ครบทั้งสองค่า
- ถ้ามี Due date อย่างเดียว ระบบใช้ Due date เป็นจุด Milestone แบบหนึ่งวัน; ถ้ามี Start date อย่างเดียวใช้แถบหนึ่งวันและแจ้งให้กำหนด Due date

Acceptance Criteria:

- การปรับแถบวันที่อัปเดตค่าเดียวกับที่เห็นใน List/Gantt
- ไม่อนุญาตให้ Due date ก่อน Start date
- งานที่ไม่กำหนดวันที่ยังสามารถเข้าถึงได้และไม่หายจาก Project

### 10.4 Gantt Chart

วัตถุประสงค์: ให้ Project Admin และทีมเห็นรายการงาน ลำดับชั้น และระยะเวลาในหน้าจอเดียว

- Desktop ใช้ Split view: ตารางงานด้านซ้ายและแผนภูมิแถบเวลาด้านขวา
- ตารางแสดง Task/Subtask แบบลำดับชั้น พร้อม Status, Assignee, Start date และ Due date
- Expand/Collapse Task เพื่อแสดง Subtask ได้
- เลือก Zoom แบบ Week หรือ Month ได้
- แถบของ Task/Subtask แสดงช่วง Start ถึง Due date
- Progress ของ Task หลักคำนวณจากจำนวน Subtask ที่ Done; ถ้าไม่มี Subtask ใช้ 0% หรือ 100% ตาม Status
- Admin/Member ปรับวันที่ด้วย Drag/Resize บน Desktop ได้
- งานที่ไม่กำหนดวันแสดงในตารางและในกลุ่ม “ยังไม่กำหนดเวลา” แต่ไม่มีแถบ
- Mobile ใช้ Table/List เป็นหลักและมีปุ่มเปิดแผนภูมิแนวนอนเต็มพื้นที่
- MVP ไม่แสดง Dependency arrow, Critical path, Baseline หรือ Auto scheduling

Acceptance Criteria:

- Task/Subtask แสดงตามลำดับชั้นถูกต้องและไม่อนุญาตระดับลึกกว่า 1 ชั้น
- การเปลี่ยนวันที่จาก Gantt สะท้อนใน Timeline และ List
- Horizontal scroll ต้องไม่ทำให้คอลัมน์ชื่อ Task หายบน Desktop; ชื่อ Task ควร Sticky

### 10.5 ความแตกต่างระหว่าง Timeline และ Gantt

| ประเด็น | Timeline | Gantt |
|---|---|---|
| จุดประสงค์ | ดูภาพรวมตามเวลาอย่างรวดเร็ว | วางแผนเชิงรายละเอียด |
| รายการที่แสดงหลัก | Task หลัก | Task และ Subtask |
| Layout | แถบเวลาแบบเต็มพื้นที่ | ตาราง + แถบเวลา |
| ลำดับชั้น | ซ่อนตามค่าเริ่มต้น | แสดง Expand/Collapse |
| Progress | แสดง Status | แสดง Progress จาก Subtask |
| Mobile | เน้นอ่านและเลื่อน | รายการก่อน แผนภูมิเป็นโหมดเสริม |

---

## 11. User Flows หลัก

### 11.1 เริ่มต้นใช้งาน

1. ผู้ใช้ Sign in
2. ระบบตรวจ Workspace membership
3. ถ้าเป็น Admin คนแรก ระบบให้ตั้งชื่อ Workspace
4. Admin สร้าง Project แรก
5. ระบบพาไป Kanban และแสดง Empty state พร้อมปุ่ม Add task

### 11.2 สร้าง Task และ Subtask

1. Admin/Member กด Add task
2. กรอก Title และข้อมูลเสริม
3. ระบบสร้าง Task และเปิด Drawer หากผู้ใช้ต้องการเพิ่มรายละเอียด
4. ผู้ใช้เลือก Add subtask ใน Drawer
5. กรอก Title ของ Subtask และบันทึก
6. ระบบอัปเดต Subtask progress ของ Task หลัก

### 11.3 อัปเดตสถานะจาก Kanban

1. Admin/Member ลาก Card ไปคอลัมน์ใหม่
2. UI แสดงตำแหน่งใหม่แบบ Optimistic update
3. ระบบบันทึก Status และ Position
4. เมื่อสำเร็จ ข้อมูลเดียวกันปรากฏใน List, Timeline และ Gantt
5. หากล้มเหลว UI คืน Card และแสดง Error

### 11.4 ลบ Task

1. Admin/Member เลือก Delete จาก Task drawer
2. ระบบแจ้งว่าจะลบ Task และ Subtask ที่อยู่ข้างใต้
3. ผู้ใช้ยืนยัน
4. ระบบกำหนด `deleted_at` ให้ Task และ Subtask
5. รายการหายจากทุก View

---

## 12. UX/UI Requirements

### 12.1 หลักการออกแบบ

- ใช้คำศัพท์และ Action เดิมในทุก View
- Primary action ต่อหน้าควรมีเพียงหนึ่งรายการที่เด่นชัด
- เปิดรายละเอียดด้วย Drawer เพื่อรักษาบริบทของ View
- ใช้สีคู่กับข้อความหรือ Icon เสมอ ไม่ใช้สีเป็นตัวบอกสถานะเพียงอย่างเดียว
- การลบต้องมี Confirmation และระบุผลกระทบต่อ Subtask
- Action ที่ Guest ใช้ไม่ได้ควรถูกซ่อนหรือ Disabled พร้อมคำอธิบายตามบริบท

### 12.2 Responsive Breakpoints ที่แนะนำ

| ช่วง | แนวทาง |
|---|---|
| Mobile `< 768px` | Sidebar เป็น Drawer, List เป็น Card, Kanban ใช้ Status tabs, Timeline/Gantt เน้นการอ่าน |
| Tablet `768–1023px` | Sidebar ย่อได้, ตารางลดคอลัมน์, Chart เลื่อนแนวนอน |
| Desktop `≥ 1024px` | Sidebar ถาวร, แสดงหลายคอลัมน์, รองรับ Drag/Resize เต็มรูปแบบ |

### 12.3 Accessibility

- เป้าหมาย WCAG 2.2 ระดับ AA สำหรับ Flow หลัก
- ทุก Action ใช้ Keyboard ได้ รวมถึงทางเลือกสำหรับ Drag and drop
- Focus state มองเห็นชัดเจน
- Form field มี Label และ Error message ที่สัมพันธ์กัน
- Contrast ของข้อความและสถานะผ่านเกณฑ์ AA
- Icon-only button มี Accessible name
- Drawer/Modal จัดการ Focus trap และคืน Focus เมื่อปิด

---

## 13. Technical Architecture

### 13.1 Stack ที่แนะนำ

| Layer | เทคโนโลยี | เหตุผล |
|---|---|---|
| Web framework | Next.js App Router + TypeScript | ทำงานกับ Vercel โดยตรง รองรับ Server/Client Components |
| Styling | Tailwind CSS | ทำ Responsive UI ได้เร็วและกำหนด Design token ได้ง่าย |
| UI primitives | Radix UI หรือ shadcn/ui | ลดเวลาสร้าง Modal, Drawer, Dropdown และ Accessibility พื้นฐาน |
| Data/Auth | Supabase Postgres + Auth | รวมฐานข้อมูล การยืนยันตัวตน และ RLS |
| Client cache | TanStack Query หรือ Server Actions + targeted revalidation | จัดการ Optimistic update และ Error rollback |
| Drag and drop | dnd-kit | รองรับ Pointer/Keyboard และควบคุม interaction ได้ |
| Date utilities | date-fns | จัดการและแสดงวันที่ |
| Hosting | Vercel | Deploy Next.js แบบ Zero-config และ Preview deployment |

Vercel ระบุว่า Next.js สามารถ Deploy แบบ Zero-configuration และมีความสามารถด้านการกระจายการให้บริการบนแพลตฟอร์ม ส่วน Supabase มี Quickstart สำหรับ Next.js App Router และ Cookie-based Auth โดยตรง ([Vercel — Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs), [Supabase — Next.js Auth](https://supabase.com/docs/guides/auth/quickstarts/nextjs))

### 13.2 ภาพรวมการไหลของระบบ

```text
Browser
  │
  ▼
Next.js application on Vercel
  ├── Server Components / Server Actions
  ├── Client Components for drag, resize, filters
  └── Supabase SSR client (cookie-based session)
          │
          ▼
Supabase
  ├── Auth
  ├── PostgreSQL
  └── Row Level Security policies
```

### 13.3 แนวทางการเข้าถึงข้อมูล

- อ่านข้อมูลเริ่มต้นผ่าน Server Components เมื่อเหมาะสม
- การโต้ตอบ เช่น Drag and drop และ Inline edit ใช้ Client Component พร้อม Optimistic update
- Mutation สำคัญตรวจ Input ที่ Server/Database ซ้ำ
- ใช้ Supabase publishable key ฝั่ง Client และเปิด RLS ทุกตารางที่เปิดผ่าน Data API
- ห้ามนำ `service_role` หรือ Secret key ไปไว้ฝั่ง Browser
- Session ฝั่ง Server ใช้ Cookie ตามแนวทาง Supabase SSR ([Supabase — Server-side Auth](https://supabase.com/docs/guides/auth/server-side))

### 13.4 Realtime

Realtime ไม่จำเป็นต่อการเปิดตัว MVP หากทีมยอมรับการ Refresh/Revalidation หลัง Mutation อย่างไรก็ตาม แนะนำเพิ่ม Supabase Realtime ในรุ่น 1.1 เพื่อให้การแก้จากสมาชิกคนหนึ่งปรากฏในหน้าของสมาชิกอื่นทันที โดยต้องกำหนดสิทธิ์ Channel และ RLS ให้สอดคล้องกับ Workspace ([Supabase — Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization))

---

## 14. Database Schema ที่แนะนำ

```text
profiles
- id uuid PK -> auth.users.id
- display_name text
- avatar_url text nullable
- created_at timestamptz

workspaces
- id uuid PK
- name text
- created_by uuid -> profiles.id
- created_at timestamptz
- updated_at timestamptz

workspace_members
- workspace_id uuid -> workspaces.id
- user_id uuid -> profiles.id
- role workspace_role enum(admin, member, guest)
- joined_at timestamptz
- PK(workspace_id, user_id)

projects
- id uuid PK
- workspace_id uuid -> workspaces.id
- name text
- description text nullable
- color text nullable
- created_by uuid -> profiles.id
- created_at timestamptz
- updated_at timestamptz

tasks
- id uuid PK
- project_id uuid -> projects.id
- parent_task_id uuid nullable -> tasks.id
- title text
- description text nullable
- status task_status enum(todo, in_progress, done)
- priority task_priority enum(low, medium, high) nullable
- assignee_id uuid nullable -> profiles.id
- start_date date nullable
- due_date date nullable
- position numeric
- created_by uuid -> profiles.id
- created_at timestamptz
- updated_at timestamptz
- deleted_at timestamptz nullable
```

Indexes ที่แนะนำ:

- `workspace_members(user_id, workspace_id)`
- `projects(workspace_id)`
- `tasks(project_id, deleted_at)`
- `tasks(project_id, status, position)`
- `tasks(parent_task_id)`
- `tasks(assignee_id)`
- `tasks(project_id, due_date)`

Database constraints/triggers:

- Check `due_date >= start_date` เมื่อทั้งสองค่าไม่ว่าง
- ป้องกัน `parent_task_id = id`
- Trigger ป้องกัน Subtask ซ้อนเกินหนึ่งระดับ
- Trigger หรือ Transaction ตรวจว่า Parent และ Child อยู่ Project เดียวกัน
- Trigger อัปเดต `updated_at`
- Mutation การลบ Task หลักควรทำใน Database function/transaction เพื่อ Soft delete ลูกพร้อมกัน

---

## 15. Row Level Security (RLS)

Supabase แนะนำให้เปิด RLS สำหรับทุกตารางใน Schema ที่เปิดผ่าน API และกำหนดทั้ง Grants และ Policies ให้ตรงกับสิทธิ์ที่ต้องการ ([Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase — Securing your data](https://supabase.com/docs/guides/database/secure-data))

นโยบายระดับสูง:

| ตาราง | Select | Insert | Update | Delete/Soft delete |
|---|---|---|---|---|
| `profiles` | ผู้ใช้ที่อยู่ Workspace ร่วมกันตามข้อมูลที่จำเป็น | เจ้าของบัญชี/ระบบ | เจ้าของ Profile | ไม่ให้ผ่าน Client |
| `workspaces` | สมาชิก Workspace | Flow สร้าง Workspace | Admin | Admin; แนะนำไม่เปิดใน MVP |
| `workspace_members` | สมาชิก Workspace เดียวกัน | Admin หรือ Invitation flow | Admin | Admin และห้ามลบ Admin คนสุดท้าย |
| `projects` | สมาชิก Workspace | Admin | Admin | Admin |
| `tasks` | สมาชิก Workspace และ `deleted_at is null` | Admin/Member | Admin/Member | ใช้ Soft delete โดย Admin/Member |

ข้อกำหนดด้านความปลอดภัย:

- ตรวจ Role จาก `workspace_members` ใน Policy หรือ Security definer helper function ที่ผ่านการตรวจสอบ
- ไม่เก็บ Role สำหรับการอนุญาตไว้ใน `raw_user_meta_data` เพราะผู้ใช้แก้ไขข้อมูลส่วนนี้ได้
- เขียน RLS test ทั้งกรณี Allow และ Deny สำหรับ Admin, Member, Guest และผู้ที่อยู่นอก Workspace
- ปิดสิทธิ์ `anon` สำหรับข้อมูล Workspace ทั้งหมด
- จำกัด Column/Operation grants ตาม Least privilege

---

## 16. Non-functional Requirements

### 16.1 Performance

- หน้า Project ควรแสดง Skeleton ภายใน 300 ms หลัง Navigation
- LCP เป้าหมายไม่เกิน 2.5 วินาทีที่เปอร์เซ็นไทล์ 75 บนเครือข่ายมือถือมาตรฐาน
- การเปลี่ยน Status แบบ Optimistic ต้องตอบสนองทางสายตาภายใน 100 ms
- รองรับอย่างน้อย 1,000 Task ต่อ Project โดยใช้ Pagination/Virtualization เมื่อเกิน 200 รายการใน List/Gantt
- Query ทุก View ต้อง Filter ด้วย `project_id` และ `deleted_at` ที่ Database

### 16.2 Reliability และ Data integrity

- Mutation ต้อง Idempotent เมื่อเหมาะสม และป้องกันการกดซ้ำระหว่างกำลังบันทึก
- การลบ Task กับ Subtask ต้องเกิดใน Transaction เดียว
- บันทึกเวลาเป็น UTC; วันที่งานใช้ชนิด `date` เพื่อลดปัญหา Timezone
- แสดงวันที่ตาม Locale ไทยได้ แต่ใช้รูปแบบที่ไม่กำกวม เช่น `20 ก.ย. 2026`

### 16.3 Security

- HTTPS เท่านั้นใน Production
- Environment variables แยก Development, Preview และ Production
- Secret อยู่ใน Vercel Environment Variables และห้าม Commit ลง Repository
- ตรวจสอบ Input ทั้งฝั่ง Client และ Server
- Rate limit จุดที่เสี่ยง เช่น Sign in และ Invitation
- Dependency scanning และอัปเดตแพ็กเกจที่มีช่องโหว่ร้ายแรงก่อน Deploy

### 16.4 Observability

- เก็บ Error ฝั่ง Client/Server ด้วยบริการ เช่น Sentry ในระยะเปิดตัว
- Vercel logs ต้องไม่บันทึก Access token, Password หรือข้อมูลลับ
- เก็บ Audit ขั้นพื้นฐานจาก `created_by`, `created_at`, `updated_at`; Activity log เต็มรูปแบบเป็นระยะถัดไป

### 16.5 Browser support

- Chrome, Edge, Safari และ Firefox เวอร์ชันล่าสุดสองเวอร์ชัน
- Mobile Safari และ Chrome for Android เวอร์ชันล่าสุดสองเวอร์ชัน

---

## 17. Empty, Loading และ Error States

| สถานการณ์ | พฤติกรรม |
|---|---|
| ไม่มี Project | แสดงคำอธิบายและปุ่ม Create project เฉพาะ Admin |
| ไม่มี Task | แสดงตัวอย่างสั้นและปุ่ม Add task เฉพาะ Admin/Member |
| Filter ไม่พบข้อมูล | แสดง “ไม่พบงานตามตัวกรอง” พร้อม Clear filters |
| Timeline/Gantt ไม่มีวัน | แสดงกลุ่ม “ยังไม่กำหนดเวลา” และคำแนะนำให้เพิ่มวันที่ |
| กำลังโหลด | Skeleton ที่ใกล้เคียง Layout จริง |
| Mutation ล้มเหลว | Rollback UI, Error toast และ Retry เมื่อปลอดภัย |
| ไม่มีสิทธิ์ | หน้า 403 พร้อมลิงก์กลับ Workspace |
| ไม่พบข้อมูล | หน้า 404 โดยไม่เปิดเผยว่ารายการมีอยู่ใน Workspace อื่นหรือไม่ |

---

## 18. Analytics Events ที่แนะนำ

เก็บเฉพาะข้อมูลการใช้งานที่จำเป็นและไม่เก็บ Description/Title ของงานใน Analytics

| Event | Properties ตัวอย่าง |
|---|---|
| `project_created` | role |
| `task_created` | source_view, has_assignee, has_due_date |
| `subtask_created` | source_view |
| `task_status_changed` | source_view, from_status, to_status |
| `task_dates_changed` | source_view, method(drawer/drag/resize) |
| `view_changed` | from_view, to_view |
| `filter_applied` | view, filter_type |
| `task_deleted` | has_subtasks, source_view |
| `permission_denied` | role, attempted_action |

---

## 19. Test Plan และ Definition of Done

### 19.1 การทดสอบขั้นต่ำ

- Unit test สำหรับ Validation, Date calculation, Progress และ Permission helpers
- Integration test สำหรับ CRUD และ Database constraints
- RLS test ครบทุก Role และผู้ใช้นอก Workspace
- End-to-end test สำหรับ Sign in, Create project, Create/Edit/Delete Task, Add Subtask และสลับ 4 Views
- Responsive test ที่ความกว้าง 375, 768, 1024 และ 1440 px
- Keyboard navigation และ Screen reader smoke test สำหรับ Flow หลัก
- Cross-browser smoke test ตาม Browser support

### 19.2 Definition of Done สำหรับ MVP

- Functional requirement ระดับ MVP ผ่าน Acceptance test
- ไม่มีช่องทางที่ Guest แก้ไขข้อมูลได้
- ข้อมูลที่เปลี่ยนจาก View ใด View หนึ่งตรงกันในอีก 3 Views หลัง Revalidation
- ไม่มี Critical/High severity defect ที่ยังเปิดอยู่
- Migration และ RLS policy สามารถสร้าง Environment ใหม่ได้จาก Repository
- Preview deployment ผ่านการทดสอบก่อน Promote ไป Production
- มี Error monitoring และ Rollback procedure

---

## 20. ลำดับการพัฒนาแนะนำ

### Phase 1 — Foundation

- Next.js/Vercel project setup
- Supabase schema, migration, Auth และ RLS
- Workspace, membership และ Project CRUD
- Responsive application shell

### Phase 2 — Core task management

- Task/Subtask CRUD
- Task detail drawer
- Search, Filter และ Sort
- List View

### Phase 3 — Visual views

- Kanban + Drag and drop
- Timeline + Date interaction
- Gantt + Hierarchy and progress
- Cross-view consistency tests

### Phase 4 — Hardening and launch

- Responsive polish
- Accessibility
- Performance/virtualization
- RLS/E2E/security tests
- Monitoring, production configuration และ UAT

---

## 21. ข้อเสนอแนะสำหรับรุ่นถัดไป

เรียงตามประโยชน์ต่อทีมขนาดเล็ก:

1. **Realtime synchronization** — เห็นการแก้ไขของเพื่อนร่วมทีมทันที
2. **Comments และ mentions** — ลดการคุยเรื่องงานกระจัดกระจายในแชต
3. **Task dependencies** — ทำให้ Gantt มีประโยชน์ด้านการวางแผนมากขึ้น
4. **Notifications** — แจ้งเมื่อถูก Assign หรือกำหนดส่งใกล้ถึง
5. **Activity log / Trash** — ตรวจสอบย้อนหลังและกู้คืนข้อมูลที่ลบ
6. **Calendar View** — เหมาะกับทีมที่เน้น Due date
7. **File attachments** — รวมเอกสารที่เกี่ยวข้องกับงาน
8. **PWA** — ติดตั้งบนหน้าจอมือถือและเพิ่มประสบการณ์คล้ายแอปด้วย Codebase เดียว; Next.js รองรับ Web App Manifest ผ่าน App Router ([Next.js — PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps))

---

## 22. ความเสี่ยงและแนวทางลดความเสี่ยง

| ความเสี่ยง | ผลกระทบ | แนวทาง |
|---|---|---|
| Timeline กับ Gantt ดูคล้ายกันเกินไป | ผู้ใช้ไม่เข้าใจว่าควรใช้ View ใด | แยกบทบาทชัดเจน: Timeline สำหรับภาพรวม, Gantt สำหรับ Task/Subtask และรายละเอียด |
| Drag and drop บน Mobile ใช้ยาก | อัปเดตผิดหรือเลื่อนหน้าจอลำบาก | ใช้ Status tabs/Drawer และลดการ Drag บน Mobile |
| RLS ผิดพลาดทำให้ข้อมูลข้าม Workspace รั่ว | ร้ายแรง | Policy + Grants แบบ Least privilege และ RLS test ทั้ง Allow/Deny |
| Gantt ช้าบน Project ใหญ่ | UX แย่ | Virtualization, จำกัดช่วงวันที่ และโหลดเฉพาะ Project ปัจจุบัน |
| Soft delete ไม่มีหน้ากู้คืนใน MVP | ผู้ใช้กู้เองไม่ได้ | เก็บข้อมูล 30 วันและให้ Admin ติดต่อผู้ดูแล; เพิ่ม Trash ในรุ่นถัดไป |
| Member ลบงานของผู้อื่นได้ | ลบโดยไม่ตั้งใจ | Confirmation ชัดเจน, Soft delete และเพิ่ม Activity/Trash ในรุ่นถัดไป |

---

## 23. สมมติฐานและประเด็นที่ควรยืนยันก่อนพัฒนา

เอกสารนี้ใช้สมมติฐานต่อไปนี้เพื่อให้ MVP เดินหน้าได้โดยไม่ซับซ้อน:

- ทุก Project ใน Workspace มองเห็นได้โดยสมาชิก Workspace ทุกคน
- Member แก้ไขและลบ Task/Subtask ของทุกคนได้
- Guest เห็นข้อมูลทุก Project แต่ไม่มีสิทธิ์แก้ไข
- Task มี Assignee ได้ 1 คน
- Subtask ลึกได้ 1 ระดับ
- Status ใช้ 3 ค่าและยังปรับแต่งไม่ได้
- Timeline/Gantt ใช้วันที่ระดับวัน ไม่ใช้เวลาเป็นชั่วโมง
- UI หลักเป็นภาษาไทย; ชื่อสถานะอาจแสดงเป็นภาษาไทย เช่น “ต้องทำ”, “กำลังทำ”, “เสร็จแล้ว” แต่เก็บค่ามาตรฐานภาษาอังกฤษในฐานข้อมูล
- ยังไม่มี Dependency ใน Gantt MVP
- Soft-deleted Task เก็บอย่างน้อย 30 วันก่อนกระบวนการลบถาวร

หากสมมติฐานข้อใดไม่ตรง ควรแก้ก่อนเริ่มออกแบบ Database migration และ RLS เพราะมีผลต่อโครงสร้างสิทธิ์และ UX หลัก

---

## 24. แหล่งอ้างอิง

- [Asana — Project Views](https://asana.com/product/timeline)
- [Linear — Display Options](https://linear.app/docs/display-options)
- [Linear — Board Layout](https://linear.app/docs/board-layout)
- [Jira — Features](https://www.atlassian.com/software/jira/features)
- [Jira — Timeline Guide](https://www.atlassian.com/software/jira/guides/basic-roadmaps/overview)
- [Jira — Board Guide](https://www.atlassian.com/software/jira/guides/boards/overview)
- [ClickUp — Task Views](https://help.clickup.com/hc/en-us/articles/6310383076503-Task-views)
- [Supabase — Next.js Auth Quickstart](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
- [Supabase — Server-side Auth](https://supabase.com/docs/guides/auth/server-side)
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase — Securing Data](https://supabase.com/docs/guides/database/secure-data)
- [Supabase — Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Vercel — Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Next.js — App Router](https://nextjs.org/docs/app)
