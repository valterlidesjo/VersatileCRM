import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";

export const Route = createFileRoute("/quotes/")({
  component: QuotesPage,
});

function QuotesPage() {
  return (
    <PageContainer
      title="Quotes"
      description="Create and manage quotes"
    >
      <p className="text-muted-foreground">Quote management will be implemented here.</p>
    </PageContainer>
  );
}
