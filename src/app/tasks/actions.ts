"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { validateDateRange } from "@/lib/date-grid";
import { mapTask } from "@/lib/tasks";
import type { TaskMutationInput, TaskRecord } from "@/lib/types";
import { loadWorkspaceData } from "@/lib/workspace";

export type TaskActionResult = {
  ok: boolean;
  error?: string;
  task?: TaskRecord;
};

const nullableUuid = z.union([z.uuid(), z.null()]).optional();
const nullableDate = z.union([z.iso.date(), z.literal(""), z.null()]).optional();

const createTaskSchema = z.object({
  projectId: z.uuid().or(z.string().startsWith("demo-")),
  parentTaskId: nullableUuid,
  title: z.string().trim().min(1).max(200),
  description: z.string().max(10000).nullable().optional(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).nullable().optional(),
  assigneeId: nullableUuid,
  startDate: nullableDate,
  dueDate: nullableDate,
  position: z.number().finite().min(0).optional(),
});

const updateTaskSchema = createTaskSchema
  .omit({ parentTaskId: true })
  .partial()
  .extend({ projectId: z.uuid(), title: z.string().trim().min(1).max(200).optional() });

function normalizeDate(value: string | null | undefined) {
  return value || null;
}

async function getEditorContext(projectId: string) {
  const workspace = await loadWorkspaceData();
  if (!workspace) return { error: "กรุณาเข้าสู่ระบบใหม่" } as const;
  if (workspace.workspace.role === "guest") {
    return { error: "Guest ไม่มีสิทธิ์แก้ไขงาน" } as const;
  }
  if (!workspace.projects.some((project) => project.id === projectId)) {
    return { error: "ไม่พบโปรเจกต์ใน Workspace นี้" } as const;
  }
  return { workspace } as const;
}

export async function createTask(input: TaskMutationInput): Promise<TaskActionResult> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "ข้อมูล Task ไม่ถูกต้อง" };
  const dateError = validateDateRange(normalizeDate(parsed.data.startDate), normalizeDate(parsed.data.dueDate));
  if (dateError) return { ok: false, error: dateError };

  const context = await getEditorContext(parsed.data.projectId);
  if ("error" in context) return { ok: false, error: context.error };

  const supabase = await createClient();
  const { data: lastTask } = await supabase
    .from("tasks")
    .select("position")
    .eq("project_id", parsed.data.projectId)
    .is("parent_task_id", parsed.data.parentTaskId ?? null)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = Number(lastTask?.position ?? 0) + 1000;
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: parsed.data.projectId,
      parent_task_id: parsed.data.parentTaskId ?? null,
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status,
      priority: parsed.data.priority ?? null,
      assignee_id: parsed.data.assigneeId ?? null,
      start_date: normalizeDate(parsed.data.startDate),
      due_date: normalizeDate(parsed.data.dueDate),
      position: nextPosition,
      created_by: context.workspace.user.id,
    })
    .select("id, project_id, parent_task_id, title, description, status, priority, assignee_id, start_date, due_date, position, created_at, updated_at")
    .single();

  if (error || !data) return { ok: false, error: error?.message || "สร้าง Task ไม่สำเร็จ" };
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { ok: true, task: mapTask(data) };
}

export async function updateTask(
  taskId: string,
  input: Partial<TaskMutationInput> & { projectId: string },
): Promise<TaskActionResult> {
  if (!z.uuid().safeParse(taskId).success) return { ok: false, error: "Task ID ไม่ถูกต้อง" };
  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "ข้อมูล Task ไม่ถูกต้อง" };

  const context = await getEditorContext(parsed.data.projectId);
  if ("error" in context) return { ok: false, error: context.error };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("tasks")
    .select("project_id, start_date, due_date")
    .eq("id", taskId)
    .maybeSingle();
  if (!existing || existing.project_id !== parsed.data.projectId) {
    return { ok: false, error: "ไม่พบ Task ในโปรเจกต์นี้" };
  }

  const nextStartDate = parsed.data.startDate !== undefined
    ? normalizeDate(parsed.data.startDate)
    : existing.start_date;
  const nextDueDate = parsed.data.dueDate !== undefined
    ? normalizeDate(parsed.data.dueDate)
    : existing.due_date;
  const dateError = validateDateRange(nextStartDate, nextDueDate);
  if (dateError) return { ok: false, error: dateError };

  const patch: Record<string, string | number | null> = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.description !== undefined) patch.description = parsed.data.description || null;
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;
  if (parsed.data.priority !== undefined) patch.priority = parsed.data.priority;
  if (parsed.data.assigneeId !== undefined) patch.assignee_id = parsed.data.assigneeId;
  if (parsed.data.startDate !== undefined) patch.start_date = normalizeDate(parsed.data.startDate);
  if (parsed.data.dueDate !== undefined) patch.due_date = normalizeDate(parsed.data.dueDate);
  if (parsed.data.position !== undefined) patch.position = parsed.data.position;

  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", taskId)
    .eq("project_id", parsed.data.projectId)
    .select("id, project_id, parent_task_id, title, description, status, priority, assignee_id, start_date, due_date, position, created_at, updated_at")
    .single();

  if (error || !data) return { ok: false, error: error?.message || "บันทึก Task ไม่สำเร็จ" };
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { ok: true, task: mapTask(data) };
}

export async function softDeleteTask(taskId: string, projectId: string): Promise<TaskActionResult> {
  if (!z.uuid().safeParse(taskId).success || !z.uuid().safeParse(projectId).success) {
    return { ok: false, error: "ข้อมูล Task ไม่ถูกต้อง" };
  }
  const context = await getEditorContext(projectId);
  if ("error" in context) return { ok: false, error: context.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc("soft_delete_task", { target_task_id: taskId });
  if (error) return { ok: false, error: error.message || "ลบ Task ไม่สำเร็จ" };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
