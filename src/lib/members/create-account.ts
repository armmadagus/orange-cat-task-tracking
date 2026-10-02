import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { MemberActionResult, WorkspaceRole } from "@/lib/types";
import { loadWorkspaceData } from "@/lib/workspace";

const createMemberSchema = z.object({
  workspaceId: z.uuid(),
  email: z.email().max(320),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
  role: z.enum(["admin", "member", "guest"]),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "passwords_mismatch",
});

function friendlyError(message?: string) {
  if (!message) return "ดำเนินการไม่สำเร็จ";
  if (message.includes("already a workspace member")) return "ผู้ใช้นี้เป็นสมาชิกอยู่แล้ว";
  return "เพิ่มสมาชิกไม่สำเร็จ กรุณาลองใหม่";
}

export async function createMemberAccount(input: unknown): Promise<MemberActionResult> {
  const parsed = createMemberSchema.safeParse(input);
  if (!parsed.success) {
    if (parsed.error.issues[0]?.message === "passwords_mismatch") {
      return { ok: false, error: "รหัสผ่านและการยืนยันไม่ตรงกัน" };
    }
    return { ok: false, error: "กรุณาตรวจสอบอีเมล บทบาท และรหัสผ่านอย่างน้อย 8 ตัวอักษร" };
  }

  const workspace = await loadWorkspaceData();
  if (!workspace) return { ok: false, error: "กรุณาเข้าสู่ระบบใหม่" };
  if (
    workspace.workspace.id !== parsed.data.workspaceId ||
    workspace.workspace.role !== "admin"
  ) {
    return { ok: false, error: "เฉพาะผู้ดูแล Workspace เท่านั้นที่จัดการสมาชิกได้" };
  }

  const supabase = await createClient();
  const memberParams = {
    target_workspace_id: parsed.data.workspaceId,
    member_email: parsed.data.email.trim().toLowerCase(),
    member_role: parsed.data.role,
  };
  let createdAccount = false;
  let { data: userId, error } = await supabase.rpc("add_workspace_member_by_email", memberParams);

  if (error?.message.includes("No registered user")) {
    const admin = createAdminClient();
    if (!admin) {
      return {
        ok: false,
        error: "ระบบยังไม่ได้ตั้งค่า SUPABASE_SECRET_KEY บน server",
      };
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: memberParams.member_email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        display_name: memberParams.member_email.split("@")[0],
      },
    });

    if (createError || !created.user) {
      if (createError?.code === "weak_password") {
        return { ok: false, error: "รหัสผ่านเริ่มต้นยังไม่ผ่านนโยบายความปลอดภัย" };
      }
      if (createError?.code === "email_exists") {
        return { ok: false, error: "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาลองเพิ่มอีกครั้ง" };
      }
      return { ok: false, error: "สร้างบัญชีผู้ใช้ไม่สำเร็จ กรุณาลองใหม่" };
    }

    createdAccount = true;
    ({ data: userId, error } = await supabase.rpc("add_workspace_member_by_email", memberParams));
    if (error || !userId) {
      await admin.auth.admin.deleteUser(created.user.id);
      return { ok: false, error: friendlyError(error?.message) };
    }
  }

  if (error || !userId) return { ok: false, error: friendlyError(error?.message) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", userId)
    .maybeSingle();

  revalidatePath("/members");
  return {
    ok: true,
    createdAccount,
    member: {
      id: userId,
      displayName:
        profile?.display_name ||
        profile?.email?.split("@")[0] ||
        memberParams.member_email.split("@")[0],
      email: profile?.email ?? memberParams.member_email,
      role: parsed.data.role as WorkspaceRole,
      joinedAt: new Date().toISOString(),
    },
  };
}
