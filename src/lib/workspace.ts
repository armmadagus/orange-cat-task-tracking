import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ProjectSummary, WorkspaceData, WorkspaceRole } from "@/lib/types";

type MembershipRow = {
  role: WorkspaceRole;
  workspace_id: string;
  workspaces: { id: string; name: string } | { id: string; name: string }[] | null;
};

function singleRelation<T>(relation: T | T[] | null): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export async function loadWorkspaceData(): Promise<WorkspaceData | null> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) return null;

  const [{ data: profile }, { data: membershipData, error: membershipError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userData.user.id)
        .maybeSingle(),
      supabase
        .from("workspace_members")
        .select("workspace_id, role, workspaces(id, name)")
        .eq("user_id", userData.user.id)
        .limit(1)
        .maybeSingle(),
    ]);

  if (membershipError || !membershipData) return null;

  const membership = membershipData as unknown as MembershipRow;
  const workspace = singleRelation(membership.workspaces);
  if (!workspace) return null;

  const { data: projectsData, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, description, color, updated_at")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false });

  if (projectsError) throw projectsError;

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      role: membership.role,
    },
    user: {
      id: userData.user.id,
      email: userData.user.email,
      displayName:
        (profile as { display_name?: string } | null)?.display_name ||
        userData.user.email?.split("@")[0] ||
        "สมาชิกทีม",
    },
    projects: (projectsData ?? []) as ProjectSummary[],
  };
}
