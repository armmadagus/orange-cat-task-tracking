import { ArrowLeft, Database, KeyRound, PlayCircle } from "lucide-react";
import Link from "next/link";

export default function SetupPage() {
  return (
    <main className="main-content">
      <div className="form-page">
        <Link href="/login" className="mini-action" style={{ width: "fit-content", marginBottom: 14 }}><ArrowLeft size={16} /> ไปหน้าเข้าสู่ระบบ</Link>
        <section className="form-card">
          <p className="eyebrow">Connect Supabase</p>
          <h1>เปิดใช้ระบบข้อมูลจริง</h1>
          <p>Phase 1 พร้อมเชื่อมต่อ Supabase แล้ว ทำตามสามขั้นตอนนี้เพื่อเปิด Auth, Database และ RLS</p>
          <ol className="setup-list">
            <li><Database size={17} style={{ display: "inline", marginRight: 8 }} />สร้าง Supabase project แล้วรัน migration ในโฟลเดอร์ <code>supabase/migrations</code></li>
            <li><KeyRound size={17} style={{ display: "inline", marginRight: 8 }} />คัดลอก Project URL และ Publishable key ลงไฟล์ <code>.env.local</code></li>
            <li><PlayCircle size={17} style={{ display: "inline", marginRight: 8 }} />Restart development server แล้วเปิดหน้า Sign in</li>
          </ol>
          <pre className="code-block">{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`}</pre>
          <p style={{ marginTop: 18, marginBottom: 0 }}>อย่าใส่ Secret key หรือ service role key ในตัวแปรที่ขึ้นต้นด้วย <code>NEXT_PUBLIC_</code></p>
        </section>
      </div>
    </main>
  );
}
