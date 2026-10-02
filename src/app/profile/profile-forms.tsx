"use client";

import { KeyRound, LoaderCircle, Save, ShieldCheck, UserRound } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import {
  changePassword,
  updateProfile,
  type ProfileActionState,
} from "./actions";

const initialState: ProfileActionState = { status: "idle", message: "" };

function ActionMessage({ state }: { state: ProfileActionState }) {
  if (state.status === "idle") return null;

  return (
    <p
      className={`profile-message ${state.status}`}
      role={state.status === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}

export function ProfileForms({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, initialState);
  const [passwordState, passwordAction, passwordPending] = useActionState(changePassword, initialState);
  const passwordFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (passwordState.status === "success") passwordFormRef.current?.reset();
  }, [passwordState]);

  return (
    <div className="profile-grid">
      <section className="workspace-panel profile-card" aria-labelledby="personal-info-heading">
        <div className="profile-card-heading">
          <span className="profile-card-icon"><UserRound size={21} /></span>
          <div>
            <h2 id="personal-info-heading">ข้อมูลส่วนตัว</h2>
            <p>ข้อมูลนี้ใช้แสดงชื่อของคุณใน Workspace และรายการผู้รับผิดชอบ</p>
          </div>
        </div>

        <form action={profileAction} className="profile-form">
          <div className="form-field">
            <label htmlFor="profile-display-name">ชื่อที่แสดง</label>
            <input
              className="text-input"
              id="profile-display-name"
              name="displayName"
              type="text"
              defaultValue={displayName}
              minLength={1}
              maxLength={120}
              autoComplete="name"
              required
            />
            <small>สูงสุด 120 ตัวอักษร</small>
          </div>
          <div className="form-field">
            <label htmlFor="profile-email">อีเมล</label>
            <input
              className="text-input profile-readonly"
              id="profile-email"
              type="email"
              value={email}
              autoComplete="email"
              readOnly
              aria-describedby="profile-email-help"
            />
            <small id="profile-email-help">อีเมลเป็นบัญชีสำหรับเข้าสู่ระบบและแก้ไขไม่ได้จากหน้านี้</small>
          </div>
          <ActionMessage state={profileState} />
          <div className="profile-form-actions">
            <button className="primary-button blue" type="submit" disabled={profilePending}>
              {profilePending ? <LoaderCircle size={18} className="spin" /> : <Save size={18} />}
              {profilePending ? "กำลังบันทึก" : "บันทึกข้อมูล"}
            </button>
          </div>
        </form>
      </section>

      <section className="workspace-panel profile-card" aria-labelledby="password-heading">
        <div className="profile-card-heading">
          <span className="profile-card-icon orange"><KeyRound size={21} /></span>
          <div>
            <h2 id="password-heading">เปลี่ยนรหัสผ่าน</h2>
            <p>ยืนยันรหัสผ่านปัจจุบันก่อนตั้งรหัสผ่านใหม่สำหรับบัญชีนี้</p>
          </div>
        </div>

        <form ref={passwordFormRef} action={passwordAction} className="profile-form">
          <div className="form-field">
            <label htmlFor="current-password">รหัสผ่านปัจจุบัน</label>
            <input className="text-input" id="current-password" name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required />
          </div>
          <div className="profile-password-grid">
            <div className="form-field">
              <label htmlFor="new-password">รหัสผ่านใหม่</label>
              <input className="text-input" id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
            </div>
            <div className="form-field">
              <label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</label>
              <input className="text-input" id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
            </div>
          </div>
          <div className="profile-security-note">
            <ShieldCheck size={18} />
            <span>ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษรและไม่ซ้ำกับบริการอื่น</span>
          </div>
          <ActionMessage state={passwordState} />
          <div className="profile-form-actions">
            <button className="primary-button" type="submit" disabled={passwordPending}>
              {passwordPending ? <LoaderCircle size={18} className="spin" /> : <KeyRound size={18} />}
              {passwordPending ? "กำลังเปลี่ยน" : "เปลี่ยนรหัสผ่าน"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
