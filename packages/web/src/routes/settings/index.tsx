import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";
import { requireSuperAdmin } from "@/lib/route-guards";
import { UserManagement } from "@/features/settings/components/user-management";
import { DashboardKpiConfig } from "@/features/settings/components/dashboard-kpi-config";

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
      <div className="space-y-10">
        <UserManagement />
        <div className="border-t border-border pt-8">
          <DashboardKpiConfig />
        </div>
      </div>
    </PageContainer>
  );
}
