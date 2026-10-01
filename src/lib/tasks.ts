import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { MemberOption, TaskRecord, WorkspaceData, WorkspaceRole } from "@/lib/types";

type DbTask = {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: TaskRecord["status"];
  priority: TaskRecord["priority"];
  assignee_id: string | null;
  start_date: string | null;
  due_date: string | null;
  position: number | string;
  created_at: string;
  updated_at: string;
};

export function mapTask(row: DbTask): TaskRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    parentTaskId: row.parent_task_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assigneeId: row.assignee_id,
    startDate: row.start_date,
    dueDate: row.due_date,
    position: Number(row.position),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadProjectTasks(projectId: string): Promise<TaskRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, project_id, parent_task_id, title, description, status, priority, assignee_id, start_date, due_date, position, created_at, updated_at")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as DbTask[]).map(mapTask);
}

export async function loadWorkspaceMembers(workspace: WorkspaceData): Promise<MemberOption[]> {
  const supabase = await createClient();
  const { data: memberships, error: membershipError } = await supabase
    .from("workspace_members")
    .select("user_id, role, joined_at")
    .eq("workspace_id", workspace.workspace.id)
    .order("joined_at", { ascending: true });

  if (membershipError) throw membershipError;
  const ids = (memberships ?? []).map((item) => item.user_id);
  if (ids.length === 0) return [];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .in("id", ids);

  if (profileError) throw profileError;
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (memberships ?? []).map((membership) => {
    const profile = profileMap.get(membership.user_id);
    return {
      id: membership.user_id,
      displayName: profile?.display_name || profile?.email?.split("@")[0] || "สมาชิกทีม",
      email: profile?.email ?? null,
      role: membership.role as WorkspaceRole,
      joinedAt: membership.joined_at,
    };
  });
}
