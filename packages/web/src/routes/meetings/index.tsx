import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";

export const Route = createFileRoute("/meetings/")({
  component: MeetingsPage,
});

function MeetingsPage() {
  return (
    <PageContainer
      title="Meetings"
      description="Schedule and track meetings"
    >
      <p className="text-muted-foreground">Meetings view will be implemented here.</p>
    </PageContainer>
  );
}
