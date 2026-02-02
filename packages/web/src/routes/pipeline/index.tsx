import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageContainer } from "@/components/layout/page-container";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { PipelineBoard } from "@/features/pipeline/components/pipeline-board";
import type { CustomerStatusType } from "@crm/shared";

export const Route = createFileRoute("/pipeline/")({
  component: PipelinePage,
});

function PipelinePage() {
  const { customers, loading } = useCustomers();

  const handleUpdateStatus = useCallback(
    async (customerId: string, newStatus: CustomerStatusType) => {
      await updateDoc(doc(db, "customers", customerId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    },
    []
  );

  return (
    <PageContainer
      title="Pipeline"
      description="Track your customers through each stage"
    >
      <PipelineBoard
        customers={customers}
        loading={loading}
        onUpdateStatus={handleUpdateStatus}
      />
    </PageContainer>
  );
}
