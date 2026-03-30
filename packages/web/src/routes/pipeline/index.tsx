import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { PipelineBoard } from "@/features/pipeline/components/pipeline-board";

export const Route = createFileRoute("/pipeline/")({
  component: PipelinePage,
});

function PipelinePage() {
  const { customers, loading, updateCustomerStatus } = useCustomers();

  return (
    <PageContainer
      title="Pipeline"
      description="Track your customers through each stage"
    >
      <PipelineBoard
        customers={customers}
        loading={loading}
        onUpdateStatus={updateCustomerStatus}
      />
    </PageContainer>
  );
}
