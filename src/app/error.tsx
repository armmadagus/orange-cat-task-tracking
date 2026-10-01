"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state" style={{ minHeight: "100vh" }}>
      <div className="empty-state-inner">
        <div className="empty-state-icon" style={{ color: "#b91c1c", background: "#fff1f1" }}><AlertTriangle size={34} /></div>
        <h2>โหลดข้อมูลไม่สำเร็จ</h2>
        <p>การเชื่อมต่อมีปัญหาชั่วคราว กรุณาลองอีกครั้ง</p>
        <button className="primary-button blue" type="button" onClick={reset}><RotateCcw size={17} /> ลองใหม่</button>
      </div>
    </div>
  );
}
