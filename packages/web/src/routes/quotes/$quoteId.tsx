import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";

export const Route = createFileRoute("/quotes/$quoteId")({
  component: QuoteDetailPage,
});

function QuoteDetailPage() {
  const { quoteId } = Route.useParams();

  return (
    <PageContainer title="Quote Detail" description={`Quote: ${quoteId}`}>
      <p className="text-muted-foreground">Quote detail view will be implemented here.</p>
    </PageContainer>
  );
}
