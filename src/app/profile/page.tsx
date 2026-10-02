import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { loadWorkspaceData } from "@/lib/workspace";
import { ProfileForms } from "./profile-forms";

export const metadata: Metadata = {
  title: "โปรไฟล์ของฉัน",
};

export default async function ProfilePage() {
  const data = await loadWorkspaceData();
  if (!data) redirect("/onboarding");

  return (
    <AppShell data={data} onSignOut={signOut}>
      <div className="page-container profile-page">
        <div className="page-heading-row">
          <div className="page-heading">
            <p className="eyebrow">Account settings</p>
            <h1>โปรไฟล์ของฉัน</h1>
            <p>จัดการข้อมูลที่แสดงในทีมและดูแลความปลอดภัยของบัญชี</p>
          </div>
        </div>

        <ProfileForms
          displayName={data.user.displayName}
          email={data.user.email ?? ""}
        />
      </div>
    </AppShell>
  );
}
