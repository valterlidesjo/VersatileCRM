import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";

export const Route = createFileRoute("/pipeline/")({
  component: PipelinePage,
});

function PipelinePage() {
  return (
    <PageContainer
      title="Pipeline"
      description="Track your deals through each stage"
    >
      <p className="text-muted-foreground">Sales pipeline will be implemented here.</p>
    </PageContainer>
  );
}
