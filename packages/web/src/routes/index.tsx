import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <PageContainer
      title="Dashboard"
      description="Overview of your CRM activity"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Customers" value="—" />
        <StatCard label="Open Deals" value="—" />
        <StatCard label="Meetings This Week" value="—" />
        <StatCard label="Revenue (MRR)" value="—" />
      </div>
    </PageContainer>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
