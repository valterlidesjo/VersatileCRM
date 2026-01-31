import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";

export const Route = createFileRoute("/billing/")({
  component: BillingPage,
});

function BillingPage() {
  return (
    <PageContainer
      title="Billing"
      description="Invoices and recurring payments"
    >
      <p className="text-muted-foreground">Billing management will be implemented here.</p>
    </PageContainer>
  );
}
