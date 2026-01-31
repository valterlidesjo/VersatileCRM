import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";

export const Route = createFileRoute("/customers/$customerId")({
  component: CustomerDetailPage,
});

function CustomerDetailPage() {
  const { customerId } = Route.useParams();

  return (
    <PageContainer title="Customer Detail" description={`Customer: ${customerId}`}>
      <p className="text-muted-foreground">Customer detail view will be implemented here.</p>
    </PageContainer>
  );
}
