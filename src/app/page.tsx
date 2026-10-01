import { FolderKanban, Plus, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProjectCard } from "@/components/project-card";
import { loadWorkspaceData } from "@/lib/workspace";
import { signOut } from "./actions";

export default async function WorkspacePage() {
  const data = await loadWorkspaceData();

  if (!data) redirect("/onboarding");

  return (
    <AppShell data={data} onSignOut={signOut}>
      <div className="page-container">
        <div className="page-heading-row">
          <div className="page-heading">
            <p className="eyebrow">Workspace</p>
            <h1>โปรเจกต์ของทีม</h1>
            <p>เลือกโปรเจกต์เพื่อวางแผนงาน หรือตั้งพื้นที่ใหม่สำหรับงานชิ้นถัดไป</p>
          </div>
          {data.workspace.role === "admin" && (
            <div className="heading-actions">
              <Link href="/members" className="secondary-button">
                <Users size={18} /> จัดการสมาชิก
              </Link>
              <Link href="/projects/new" className="primary-button">
                <Plus size={18} /> สร้างโปรเจกต์
              </Link>
            </div>
          )}
        </div>

        <section className="summary-strip" aria-label="สรุปเวิร์กสเปซ">
          <div className="summary-card">
            <span>โปรเจกต์ทั้งหมด</span>
            <strong>{data.projects.length}</strong>
            <p>พื้นที่งานที่ทีมเข้าถึงได้</p>
          </div>
          <div className="summary-card orange">
            <span>บทบาทของคุณ</span>
            <strong style={{ textTransform: "capitalize" }}>{data.workspace.role}</strong>
            <p>{data.workspace.role === "admin" ? "จัดการโปรเจกต์และสมาชิกได้" : "สิทธิ์ตาม Workspace policy"}</p>
          </div>
          <div className="summary-card green">
            <span>ความปลอดภัย</span>
            <strong>RLS</strong>
            <p>ข้อมูลถูกจำกัดตามเวิร์กสเปซและบทบาท</p>
          </div>
        </section>

        <section>
          <div className="section-heading">
            <div>
              <h2>โปรเจกต์ล่าสุด</h2>
              <p>เรียงตามการอัปเดตล่าสุด</p>
            </div>
            <span className="stat-chip"><ShieldCheck size={15} /> Workspace protected</span>
          </div>

          <div className="project-grid">
            {data.projects.map((project) => (
              <ProjectCard project={project} key={project.id} />
            ))}
            {data.projects.length === 0 && data.workspace.role !== "admin" && (
              <div className="empty-project-card">
                <div>
                  <FolderKanban size={28} />
                  <strong>ยังไม่มีโปรเจกต์</strong>
                  <span>Admin จะเป็นผู้สร้างโปรเจกต์แรกให้ทีม</span>
                </div>
              </div>
            )}
            {data.workspace.role === "admin" && (
              <div className="empty-project-card">
                <div>
                  <Plus size={28} />
                  <strong>สร้างโปรเจกต์ใหม่</strong>
                  <span>เพิ่มพื้นที่สำหรับติดตามงานชุดถัดไป</span>
                  <Link href="/projects/new" className="secondary-button">เริ่มสร้าง</Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
