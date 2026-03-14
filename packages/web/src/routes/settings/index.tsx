import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";
import { requireSuperAdmin } from "@/lib/route-guards";
import { UserManagement } from "@/features/settings/components/user-management";

export const Route = createFileRoute("/settings/")({
  beforeLoad: ({ context }) => requireSuperAdmin(context.auth),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <PageContainer
      title="Settings"
      description="Manage users and system settings"
    >
      <UserManagement />
    </PageContainer>
  );
}
