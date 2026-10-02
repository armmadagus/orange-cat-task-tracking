"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { MemberActionResult, WorkspaceRole } from "@/lib/types";
import { loadWorkspaceData } from "@/lib/workspace";

const roleSchema = z.enum(["admin", "member", "guest"]);
const workspaceSchema = z.uuid();

async function getAdminContext(workspaceId: string) {
  if (!workspaceSchema.safeParse(workspaceId).success) {
    return { error: "Workspace ไม่ถูกต้อง" } as const;
  }
  const workspace = await loadWorkspaceData();
  if (!workspace) return { error: "กรุณาเข้าสู่ระบบใหม่" } as const;
  if (workspace.workspace.id !== workspaceId || workspace.workspace.role !== "admin") {
    return { error: "เฉพาะผู้ดูแล Workspace เท่านั้นที่จัดการสมาชิกได้" } as const;
  }
  return { workspace } as const;
}

function friendlyError(message?: string) {
  if (!message) return "ดำเนินการไม่สำเร็จ";
  if (message.includes("No registered user")) return "ไม่พบบัญชีที่สมัครด้วยอีเมลนี้";
  if (message.includes("already a workspace member")) return "ผู้ใช้นี้เป็นสมาชิกอยู่แล้ว";
  if (message.includes("keep at least one admin")) return "Workspace ต้องมีผู้ดูแลอย่างน้อย 1 คน";
  return message;
}

export async function changeMemberRole(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
): Promise<MemberActionResult> {
  const parsed = z.object({ workspaceId: workspaceSchema, userId: z.uuid(), role: roleSchema })
    .safeParse({ workspaceId, userId, role });
  if (!parsed.success) return { ok: false, error: "ข้อมูลสมาชิกไม่ถูกต้อง" };

  const context = await getAdminContext(parsed.data.workspaceId);
  if ("error" in context) return { ok: false, error: context.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("workspace_members")
    .update({ role: parsed.data.role })
    .eq("workspace_id", parsed.data.workspaceId)
    .eq("user_id", parsed.data.userId);
  if (error) return { ok: false, error: friendlyError(error.message) };

  revalidatePath("/members");
  return { ok: true };
}

export async function removeMember(
  workspaceId: string,
  userId: string,
): Promise<MemberActionResult> {
  const parsed = z.object({ workspaceId: workspaceSchema, userId: z.uuid() })
    .safeParse({ workspaceId, userId });
  if (!parsed.success) return { ok: false, error: "ข้อมูลสมาชิกไม่ถูกต้อง" };

  const context = await getAdminContext(parsed.data.workspaceId);
  if ("error" in context) return { ok: false, error: context.error };
  if (context.workspace.user.id === parsed.data.userId) {
    return { ok: false, error: "ไม่สามารถนำบัญชีของตัวเองออกจาก Workspace ได้" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", parsed.data.workspaceId)
    .eq("user_id", parsed.data.userId);
  if (error) return { ok: false, error: friendlyError(error.message) };

  revalidatePath("/members");
  return { ok: true };
}
