export type WorkspaceRole = "admin" | "member" | "guest";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type WorkspaceSummary = {
  id: string;
  name: string;
  role: WorkspaceRole;
};

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  updated_at: string;
};

export type WorkspaceData = {
  workspace: WorkspaceSummary;
  projects: ProjectSummary[];
  user: { id: string; email?: string; displayName: string };
};

export type MemberOption = {
  id: string;
  displayName: string;
  email: string | null;
  role: WorkspaceRole;
  joinedAt?: string;
};

export type TaskRecord = {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority | null;
  assigneeId: string | null;
  startDate: string | null;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskMutationInput = {
  projectId: string;
  parentTaskId?: string | null;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority | null;
  assigneeId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  position?: number;
};
