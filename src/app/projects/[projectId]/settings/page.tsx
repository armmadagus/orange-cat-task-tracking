import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { loadWorkspaceData } from "@/lib/workspace";
import { signOut } from "@/app/actions";
import { deleteProject } from "@/app/projects/actions";
import { ProjectForm } from "@/app/projects/project-form";

export default async function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const data = await loadWorkspaceData();
  if (!data) redirect("/onboarding");
  const project = data.projects.find((item) => item.id === projectId);
  if (!project) notFound();

  return (
    <AppShell data={data} currentProject={project} onSignOut={signOut}>
      <div className="form-page">
        <Link href={`/projects/${project.id}`} className="mini-action" style={{ width: "fit-content", marginBottom: 14 }}><ArrowLeft size={16} /> กลับโปรเจกต์</Link>
        <section className="form-card">
          <p className="eyebrow">Project settings</p>
          <h1>ตั้งค่าโปรเจกต์</h1>
          <p>แก้ชื่อ รายละเอียด และสีที่ใช้แสดงใน Workspace</p>
          <ProjectForm project={project} />
        </section>

        {data.workspace.role === "admin" && (
          <section className="form-card" style={{ marginTop: 18, borderColor: "#fecaca" }}>
            <h2 style={{ marginTop: 0 }}>ลบโปรเจกต์</h2>
            <p>การลบโปรเจกต์จะลบงานภายในทั้งหมด กรุณาพิมพ์ชื่อโปรเจกต์เพื่อยืนยัน</p>
            <form action={deleteProject}>
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="expectedName" value={project.name} />
              <div className="form-field">
                <label htmlFor="confirmation">พิมพ์ “{project.name}”</label>
                <input id="confirmation" name="confirmation" className="text-input" autoComplete="off" required />
              </div>
              <div className="form-actions"><button className="danger-button" type="submit">ลบโปรเจกต์ถาวร</button></div>
            </form>
          </section>
        )}
      </div>
    </AppShell>
  );
}
