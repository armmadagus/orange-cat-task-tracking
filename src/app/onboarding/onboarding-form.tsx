"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { createWorkspace, type OnboardingState } from "./actions";

const initialState: OnboardingState = { error: null };

export function OnboardingForm() {
  const [state, action, pending] = useActionState(createWorkspace, initialState);
  return (
    <form action={action} className="form-grid">
      <div className="form-field">
        <label htmlFor="workspaceName">ชื่อเวิร์กสเปซ</label>
        <input id="workspaceName" name="workspaceName" className="text-input" placeholder="เช่น Main Engineering Hub" maxLength={100} autoFocus required />
        <small>ชื่อที่สมาชิกทุกคนในทีมจะมองเห็น</small>
      </div>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button type="submit" className="primary-button blue" disabled={pending}>
        {pending ? <LoaderCircle size={18} /> : <ArrowRight size={18} />}
        {pending ? "กำลังสร้าง" : "สร้างเวิร์กสเปซ"}
      </button>
    </form>
  );
}
