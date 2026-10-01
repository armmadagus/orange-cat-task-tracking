"use client";

import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="next" value={nextPath || "/"} />
      <div className="form-field">
        <label htmlFor="email">อีเมล</label>
        <div style={{ position: "relative" }}>
          <Mail size={17} style={{ position: "absolute", left: 12, top: 13, color: "#7b879c" }} />
          <input className="text-input" style={{ paddingLeft: 39 }} id="email" name="email" type="email" autoComplete="email" placeholder="name@company.com" required />
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="password">รหัสผ่าน</label>
        <div style={{ position: "relative" }}>
          <LockKeyhole size={17} style={{ position: "absolute", left: 12, top: 13, color: "#7b879c" }} />
          <input className="text-input" style={{ paddingLeft: 39 }} id="password" name="password" type="password" autoComplete="current-password" minLength={8} required />
        </div>
      </div>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="primary-button blue" type="submit" disabled={pending}>
        {pending ? <LoaderCircle size={18} className="spin" /> : <ArrowRight size={18} />}
        {pending ? "กำลังเข้าสู่ระบบ" : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
