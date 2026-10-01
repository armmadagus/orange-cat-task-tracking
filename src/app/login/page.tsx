import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Orange Cat Task Tracking">
        <div className="auth-brand"><span className="brand-mark">⌁</span> Orange Cat</div>
        <div className="auth-copy">
          <h1>งานของทีม<br />ชัดเจนในที่เดียว</h1>
          <p>จัดระเบียบโปรเจกต์ ติดตามสถานะ และควบคุมสิทธิ์ของทีมด้วยพื้นที่ทำงานที่เรียบง่าย</p>
          <div className="auth-grid-art" aria-hidden="true">
            {["ต้องทำ", "กำลังทำ", "เสร็จแล้ว"].map((label, index) => (
              <div className="auth-column" key={label}>
                <strong>{label}</strong>
                <div style={{ marginTop: 20, background: "rgba(255,255,255,.14)", borderRadius: 10, padding: 13 }}>
                  <div className="auth-card-line" />
                  <div className="auth-card-line short" />
                </div>
                {index === 0 && <div style={{ marginTop: 10, background: "rgba(255,255,255,.1)", height: 50, borderRadius: 10 }} />}
              </div>
            ))}
          </div>
        </div>
        <small>Workspace data protected by role-based access</small>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <p className="eyebrow">Welcome back</p>
          <h2>เข้าสู่พื้นที่ทำงาน</h2>
          <p>ใช้บัญชีที่ผู้ดูแลทีมเพิ่มไว้ให้คุณ</p>
          <LoginForm nextPath={params.next} />
        </div>
      </section>
    </main>
  );
}
