import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { MemberManagement } from "@/components/member-management";
import { loadWorkspaceMembers } from "@/lib/tasks";
import { loadWorkspaceData } from "@/lib/workspace";

export default async function MembersPage() {
  const data = await loadWorkspaceData();
  if (!data) redirect("/onboarding");
  const members = await loadWorkspaceMembers(data);

  return (
    <AppShell data={data} onSignOut={signOut}>
      <div className="page-container">
        <div className="page-heading-row">
          <div className="page-heading">
            <p className="eyebrow">Workspace access</p>
            <h1>สมาชิกทีม</h1>
            <p>กำหนดว่าใครเข้าถึง {data.workspace.name} ได้ และแต่ละคนทำอะไรได้บ้าง</p>
          </div>
        </div>

        <MemberManagement
          workspaceId={data.workspace.id}
          currentUserId={data.user.id}
          currentRole={data.workspace.role}
          initialMembers={members}
          demoMode={false}
        />
      </div>
    </AppShell>
  );
}
