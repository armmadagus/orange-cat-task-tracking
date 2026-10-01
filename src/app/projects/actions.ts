"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loadWorkspaceData } from "@/lib/workspace";

export type ProjectFormState = { error: string | null };

const projectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export async function createProject(
  _previous: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    color: formData.get("color"),
  });
  if (!parsed.success) return { error: "กรุณาตรวจสอบชื่อ รายละเอียด และสีของโปรเจกต์" };

  const workspaceData = await loadWorkspaceData();
  if (!workspaceData || workspaceData.workspace.role !== "admin") {
    return { error: "เฉพาะ Admin เท่านั้นที่สร้างโปรเจกต์ได้" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: workspaceData.workspace.id,
      created_by: workspaceData.user.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      color: parsed.data.color,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "สร้างโปรเจกต์ไม่สำเร็จ กรุณาลองใหม่" };
  revalidatePath("/");
  redirect(`/projects/${data.id}`);
}

export async function updateProject(
  _previous: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const projectId = String(formData.get("projectId") || "");
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    color: formData.get("color"),
  });
  if (!projectId || !parsed.success) return { error: "ข้อมูลโปรเจกต์ไม่ถูกต้อง" };

  const workspaceData = await loadWorkspaceData();
  if (!workspaceData || workspaceData.workspace.role !== "admin") {
    return { error: "เฉพาะ Admin เท่านั้นที่แก้ไขโปรเจกต์ได้" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      color: parsed.data.color,
    })
    .eq("id", projectId)
    .eq("workspace_id", workspaceData.workspace.id);

  if (error) return { error: "บันทึกโปรเจกต์ไม่สำเร็จ กรุณาลองใหม่" };
  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export async function deleteProject(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const confirmation = String(formData.get("confirmation") || "");
  const expectedName = String(formData.get("expectedName") || "");
  if (!projectId || confirmation !== expectedName) return;

  const workspaceData = await loadWorkspaceData();
  if (!workspaceData || workspaceData.workspace.role !== "admin") return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("workspace_id", workspaceData.workspace.id);

  if (!error) {
    revalidatePath("/");
    redirect("/");
  }
}
