"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error: string | null };

const schema = z.object({ workspaceName: z.string().trim().min(1).max(100) });

export async function createWorkspace(
  _previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const parsed = schema.safeParse({ workspaceName: formData.get("workspaceName") });
  if (!parsed.success) return { error: "กรุณาระบุชื่อเวิร์กสเปซไม่เกิน 100 ตัวอักษร" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_workspace", {
    workspace_name: parsed.data.workspaceName,
  });

  if (error) return { error: "สร้างเวิร์กสเปซไม่สำเร็จ กรุณาลองใหม่" };
  redirect("/");
}
