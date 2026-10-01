"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="th">
      <body>
        <main className="empty-state" style={{ minHeight: "100vh" }}>
          <div className="empty-state-inner">
            <div className="empty-state-icon" style={{ color: "#b91c1c", background: "#fff1f1" }}><AlertTriangle size={34} aria-hidden="true" /></div>
            <h1>ระบบทำงานผิดพลาด</h1>
            <p>เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองโหลดพื้นที่ทำงานอีกครั้ง</p>
            <button className="primary-button blue" type="button" onClick={reset}><RotateCcw size={17} aria-hidden="true" /> ลองใหม่</button>
          </div>
        </main>
      </body>
    </html>
  );
}
