import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";
import { useDashboardStats } from "@/features/dashboard/hooks/use-dashboard-stats";
import { useCompanyProfile } from "@/features/profile/hooks/use-profile";
import { GoalProgressCard } from "@/features/dashboard/components/goal-progress-card";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">
        {loading ? "—" : value}
      </p>
    </div>
  );
}

function Dashboard() {
  const { activeCustomers, meetingsThisWeek, mrr, totalIncome, loading } =
    useDashboardStats();
  const { profile, loading: profileLoading } = useCompanyProfile();

  return (
    <PageContainer
      title="Dashboard"
      description="Overview of your CRM activity"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Customers"
          value={activeCustomers.toString()}
          loading={loading}
        />
        <StatCard
          label="Meetings This Week"
          value={meetingsThisWeek.toString()}
          loading={loading}
        />
        <StatCard
          label="MRR"
          value={formatCurrency(mrr)}
          loading={loading}
        />
        <StatCard
          label="Total Income"
          value={formatCurrency(totalIncome)}
          loading={loading}
        />
      </div>

      <div className="mt-6">
        {profileLoading ? (
          <div className="rounded-lg border border-border bg-background p-6">
            <p className="text-sm text-muted-foreground">Loading goals...</p>
          </div>
        ) : (
          <GoalProgressCard
            profile={profile}
            currentIncome={totalIncome}
            currentMrr={mrr}
          />
        )}
      </div>
    </PageContainer>
  );
}
