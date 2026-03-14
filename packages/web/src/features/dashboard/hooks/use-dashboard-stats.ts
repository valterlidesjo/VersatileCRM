import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useJournalEntries } from "@/features/accounting/hooks/use-journal-entries";
import {
  countActiveCustomers,
  calculateMrr,
  calculateTotalIncome,
} from "../utils/calculations";

export function useDashboardStats() {
  const { customers, loading: customersLoading } = useCustomers();
  const { entries, loading: entriesLoading } = useJournalEntries();

  const loading = customersLoading || entriesLoading;

  return {
    activeCustomers: countActiveCustomers(customers),
    meetingsThisWeek: 0,
    mrr: calculateMrr(customers),
    totalIncome: calculateTotalIncome(entries),
    loading,
  };
}
