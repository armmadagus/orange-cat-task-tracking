"use client";

import { CalendarDays, CircleCheck, LoaderCircle, MailPlus, Shield, Trash2, UserRound, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMemberByEmail, changeMemberRole, removeMember } from "@/app/members/actions";
import type { MemberOption, WorkspaceRole } from "@/lib/types";

const roleLabels: Record<WorkspaceRole, string> = {
  admin: "ผู้ดูแล",
  member: "สมาชิก",
  guest: "Guest",
};

const roleDescriptions: Record<WorkspaceRole, string> = {
  admin: "จัดการ Workspace, Project และสมาชิก",
  member: "สร้างและแก้ไข Task",
  guest: "ดูข้อมูลได้อย่างเดียว",
};

function formatDate(value?: string) {
  if (!value) return "วันนี้";
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function MemberManagement({
  workspaceId,
  currentUserId,
  currentRole,
  initialMembers,
  demoMode,
}: {
  workspaceId: string;
  currentUserId: string;
  currentRole: WorkspaceRole;
  initialMembers: MemberOption[];
  demoMode: boolean;
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");
  const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [busyId, setBusyId] = useState("");
  const [isPending, startTransition] = useTransition();
  const canManage = currentRole === "admin";

  const addMember = () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;
    setNotice(null);

    if (demoMode) {
      if (members.some((member) => member.email?.toLowerCase() === normalizedEmail)) {
        setNotice({ type: "error", text: "ผู้ใช้นี้เป็นสมาชิกอยู่แล้ว" });
        return;
      }
      setMembers((current) => [...current, {
        id: `demo-member-${Date.now()}`,
        displayName: normalizedEmail.split("@")[0],
        email: normalizedEmail,
        role,
        joinedAt: new Date().toISOString(),
      }]);
      setEmail("");
      setNotice({ type: "success", text: "เพิ่มสมาชิกในโหมดตัวอย่างแล้ว" });
      return;
    }

    startTransition(async () => {
      const result = await addMemberByEmail(workspaceId, normalizedEmail, role);
      if (!result.ok || !result.member) {
        setNotice({ type: "error", text: result.error || "เพิ่มสมาชิกไม่สำเร็จ" });
        return;
      }
      setMembers((current) => [...current, result.member!]);
      setEmail("");
      setNotice({ type: "success", text: "เพิ่มสมาชิกเข้า Workspace แล้ว" });
      router.refresh();
    });
  };

  const updateRole = (member: MemberOption, nextRole: WorkspaceRole) => {
    const previous = members;
    setMembers((current) => current.map((item) => item.id === member.id ? { ...item, role: nextRole } : item));
    setNotice(null);
    if (demoMode) {
      setNotice({ type: "success", text: "เปลี่ยนบทบาทในโหมดตัวอย่างแล้ว" });
      return;
    }

    setBusyId(member.id);
    startTransition(async () => {
      const result = await changeMemberRole(workspaceId, member.id, nextRole);
      setBusyId("");
      if (!result.ok) {
        setMembers(previous);
        setNotice({ type: "error", text: result.error || "เปลี่ยนบทบาทไม่สำเร็จ" });
        return;
      }
      setNotice({ type: "success", text: "อัปเดตบทบาทแล้ว" });
      router.refresh();
    });
  };

  const remove = (member: MemberOption) => {
    if (!window.confirm(`นำ “${member.displayName}” ออกจาก Workspace หรือไม่?`)) return;
    const previous = members;
    setMembers((current) => current.filter((item) => item.id !== member.id));
    setNotice(null);
    if (demoMode) {
      setNotice({ type: "success", text: "นำสมาชิกออกในโหมดตัวอย่างแล้ว" });
      return;
    }

    setBusyId(member.id);
    startTransition(async () => {
      const result = await removeMember(workspaceId, member.id);
      setBusyId("");
      if (!result.ok) {
        setMembers(previous);
        setNotice({ type: "error", text: result.error || "นำสมาชิกออกไม่สำเร็จ" });
        return;
      }
      setNotice({ type: "success", text: "นำสมาชิกออกจาก Workspace แล้ว" });
      router.refresh();
    });
  };

  return (
    <>
      <section className="summary-strip member-summary">
        <div className="summary-card"><span>สมาชิกทั้งหมด</span><strong>{members.length}</strong><p>ผู้ใช้ใน Workspace นี้</p></div>
        <div className="summary-card orange"><span>ผู้ดูแลระบบ</span><strong>{members.filter((member) => member.role === "admin").length}</strong><p>จัดการโปรเจกต์และสิทธิ์</p></div>
        <div className="summary-card green"><span>Read only</span><strong>{members.filter((member) => member.role === "guest").length}</strong><p>Guest ดูข้อมูลได้อย่างเดียว</p></div>
      </section>

      {canManage && (
        <form className="member-invite workspace-panel" onSubmit={(event) => { event.preventDefault(); addMember(); }}>
          <div className="member-invite-copy">
            <span className="member-invite-icon"><MailPlus size={20} /></span>
            <div><strong>เพิ่มสมาชิกด้วยอีเมล</strong><small>ผู้ใช้ต้องสมัครบัญชีในระบบแล้ว</small></div>
          </div>
          <label className="sr-only" htmlFor="member-email">อีเมลสมาชิก</label>
          <input id="member-email" className="text-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" required />
          <label className="sr-only" htmlFor="member-role">บทบาท</label>
          <select id="member-role" className="select-input" value={role} onChange={(event) => setRole(event.target.value as WorkspaceRole)}>
            <option value="member">สมาชิก</option>
            <option value="guest">Guest</option>
            <option value="admin">ผู้ดูแล</option>
          </select>
          <button className="primary-button blue" type="submit" disabled={isPending || !email.trim()}>
            {isPending ? <LoaderCircle className="spin" size={17} /> : <MailPlus size={17} />} เพิ่มสมาชิก
          </button>
        </form>
      )}

      {notice && (
        <div className={`task-notice ${notice.type}`} role="status" aria-live="polite">
          {notice.type === "success" ? <CircleCheck size={17} /> : <Shield size={17} />}
          <span>{notice.text}</span>
          <button className="icon-button" type="button" onClick={() => setNotice(null)} aria-label="ปิดข้อความ"><X size={16} /></button>
        </div>
      )}

      <section className="workspace-panel member-panel">
        <div className="section-heading member-panel-heading">
          <div><h2>รายชื่อสมาชิก</h2><p>สิทธิ์ถูกบังคับใช้ที่ฐานข้อมูลตามบทบาท</p></div>
          <span className="stat-chip"><Shield size={15} /> 3 roles</span>
        </div>
        <div className="member-table-wrap">
          <table className="member-table">
            <thead>
              <tr><th>สมาชิก</th><th>บทบาท</th><th>วันที่เข้าร่วม</th><th>สิทธิ์หลัก</th>{canManage && <th><span className="sr-only">การจัดการ</span></th>}</tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const busy = busyId === member.id || isPending;
                return (
                  <tr key={member.id}>
                    <td>
                      <div className="member-identity">
                        <span className="avatar"><UserRound size={16} /></span>
                        <span><strong>{member.displayName}</strong><small>{member.email || "ไม่มีอีเมล"}</small></span>
                        {member.id === currentUserId && <em>คุณ</em>}
                      </div>
                    </td>
                    <td>
                      {canManage ? (
                        <select className="inline-select member-role-select" value={member.role} onChange={(event) => updateRole(member, event.target.value as WorkspaceRole)} disabled={busy}>
                          <option value="admin">ผู้ดูแล</option>
                          <option value="member">สมาชิก</option>
                          <option value="guest">Guest</option>
                        </select>
                      ) : <span className="role-pill">{roleLabels[member.role]}</span>}
                    </td>
                    <td><span className="member-date"><CalendarDays size={15} />{formatDate(member.joinedAt)}</span></td>
                    <td className="member-permission">{roleDescriptions[member.role]}</td>
                    {canManage && (
                      <td className="member-actions">
                        {busy ? <LoaderCircle className="spin" size={17} /> : (
                          <button className="icon-button danger-icon" type="button" onClick={() => remove(member)} disabled={member.id === currentUserId} title={member.id === currentUserId ? "นำบัญชีของตัวเองออกไม่ได้" : "นำสมาชิกออก"} aria-label={`นำ ${member.displayName} ออก`}><Trash2 size={17} /></button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
