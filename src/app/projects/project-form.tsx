"use client";

import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import type { ProjectSummary } from "@/lib/types";
import { createProject, updateProject, type ProjectFormState } from "./actions";

const colors = ["#0B63F6", "#FF9418", "#0F7490", "#10B981", "#8B5CF6", "#EF4444"];
const initialState: ProjectFormState = { error: null };

export function ProjectForm({ project, disabled = false }: { project?: ProjectSummary; disabled?: boolean }) {
  const action = project ? updateProject : createProject;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      {project && <input type="hidden" name="projectId" value={project.id} />}
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="name">ชื่อโปรเจกต์</label>
          <input className="text-input" id="name" name="name" defaultValue={project?.name} placeholder="เช่น Website Redesign Q4" maxLength={120} required disabled={disabled} />
        </div>
        <div className="form-field">
          <label htmlFor="description">รายละเอียด</label>
          <textarea className="text-area" id="description" name="description" defaultValue={project?.description ?? ""} placeholder="เป้าหมายหรือขอบเขตสั้น ๆ ของโปรเจกต์" maxLength={2000} disabled={disabled} />
          <small>สูงสุด 2,000 ตัวอักษร</small>
        </div>
        <fieldset className="form-field" style={{ border: 0, padding: 0, margin: 0 }} disabled={disabled}>
          <legend style={{ fontWeight: 700, marginBottom: 9 }}>สีประจำโปรเจกต์</legend>
          <div className="color-options">
            {colors.map((color) => (
              <label className="color-option" key={color}>
                <input type="radio" name="color" value={color} defaultChecked={(project?.color ?? colors[0]) === color} />
                <span className="color-swatch" style={{ background: color }} />
              </label>
            ))}
          </div>
        </fieldset>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
      </div>
      <div className="form-actions">
        <Link href={project ? `/projects/${project.id}` : "/"} className="secondary-button">ยกเลิก</Link>
        <button className="primary-button blue" type="submit" disabled={pending || disabled}>
          {pending ? <LoaderCircle size={18} /> : <Save size={18} />}
          {disabled ? "เชื่อม Supabase เพื่อบันทึก" : pending ? "กำลังบันทึก" : project ? "บันทึกการเปลี่ยนแปลง" : "สร้างโปรเจกต์"}
        </button>
      </div>
    </form>
  );
}
