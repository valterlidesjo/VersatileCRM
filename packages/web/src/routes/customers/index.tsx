import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";

export const Route = createFileRoute("/customers/")({
  component: CustomersPage,
});

function CustomersPage() {
  return (
    <PageContainer
      title="Customers"
      description="Manage your customers and leads"
    >
      <p className="text-muted-foreground">Customer list will be implemented here.</p>
    </PageContainer>
  );
}
