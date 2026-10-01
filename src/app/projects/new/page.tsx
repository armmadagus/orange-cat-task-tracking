import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { loadWorkspaceData } from "@/lib/workspace";
import { signOut } from "@/app/actions";
import { ProjectForm } from "../project-form";

export default async function NewProjectPage() {
  const data = await loadWorkspaceData();
  if (!data) redirect("/onboarding");

  return (
    <AppShell data={data} onSignOut={signOut}>
      <div className="form-page">
        <Link href="/" className="mini-action" style={{ width: "fit-content", marginBottom: 14 }}><ArrowLeft size={16} /> กลับหน้าหลัก</Link>
        <section className="form-card">
          <p className="eyebrow">New project</p>
          <h1>สร้างโปรเจกต์</h1>
          <p>ตั้งชื่อ คำอธิบาย และสีที่ช่วยให้ทีมแยกโปรเจกต์ได้ทันที</p>
          <ProjectForm />
        </section>
      </div>
    </AppShell>
  );
}
