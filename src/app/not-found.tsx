import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty-state" style={{ minHeight: "100vh" }}>
      <div className="empty-state-inner">
        <div className="empty-state-icon"><FileQuestion size={34} /></div>
        <h2>ไม่พบข้อมูลที่ต้องการ</h2>
        <p>รายการนี้อาจถูกย้าย ลบ หรืออยู่นอกเวิร์กสเปซที่คุณเข้าถึงได้</p>
        <Link href="/" className="primary-button blue">กลับหน้าหลัก</Link>
      </div>
    </div>
  );
}
