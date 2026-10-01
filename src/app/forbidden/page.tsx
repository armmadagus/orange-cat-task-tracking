import { ShieldX } from "lucide-react";
import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="empty-state" style={{ minHeight: "100vh" }}>
      <div className="empty-state-inner">
        <div className="empty-state-icon" style={{ color: "#b91c1c", background: "#fff1f1" }}><ShieldX size={34} /></div>
        <h2>คุณไม่มีสิทธิ์ทำรายการนี้</h2>
        <p>บทบาทปัจจุบันไม่สามารถเปลี่ยนแปลงข้อมูลส่วนนี้ได้</p>
        <Link href="/" className="primary-button blue">กลับ Workspace</Link>
      </div>
    </main>
  );
}
