import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";
import { AccountList } from "@/features/accounting/components/account-list";

export const Route = createFileRoute("/accounting/accounts")({
  component: AccountsPage,
});

function AccountsPage() {
  return (
    <PageContainer
      title="Kontoplan"
      description="BAS-kontoplan — sök och filtrera konton"
    >
      <AccountList />
    </PageContainer>
  );
}
