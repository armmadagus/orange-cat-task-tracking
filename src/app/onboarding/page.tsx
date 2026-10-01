import { Building2, ShieldCheck, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { loadWorkspaceData } from "@/lib/workspace";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  if (!hasSupabaseEnv()) redirect("/setup");
  const existing = await loadWorkspaceData();
  if (existing) redirect("/");

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-brand"><span className="brand-mark">⌁</span> Orange Cat</div>
        <div className="auth-copy">
          <h1>เริ่มพื้นที่ทำงานของทีม</h1>
          <p>ระบบจะตั้งคุณเป็น Admin คนแรก เพื่อสร้างโปรเจกต์และจัดการสมาชิกได้ทันที</p>
          <div style={{ display: "grid", gap: 12, marginTop: 34 }}>
            <span><ShieldCheck size={18} style={{ display: "inline", marginRight: 8 }} />สิทธิ์ Admin / Member / Guest</span>
            <span><Users size={18} style={{ display: "inline", marginRight: 8 }} />รองรับสมาชิกหลายคนใน Workspace</span>
            <span><Building2 size={18} style={{ display: "inline", marginRight: 8 }} />Schema รองรับหลาย Workspace ตั้งแต่ต้น</span>
          </div>
        </div>
        <small>ขั้นตอนที่ 1 จาก 1</small>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <p className="eyebrow">Set up workspace</p>
          <h2>ตั้งชื่อพื้นที่ทำงาน</h2>
          <p>เปลี่ยนชื่อภายหลังได้จากการตั้งค่า Workspace</p>
          <OnboardingForm />
        </div>
      </section>
    </main>
  );
}
