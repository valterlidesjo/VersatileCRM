import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useJournalEntries } from "@/features/accounting/hooks/use-journal-entries";
import { useProducts } from "@/features/inventory/hooks/use-products";
import { useMeetings } from "@/features/meetings/hooks/use-meetings";
import { derivePeriodRange, type DashboardPeriod } from "@/features/accounting/utils/period-range";
import {
  countActiveCustomers,
  calculateMrr,
  calculateTotalIncome,
  calculateShopifyRevenue,
  calculateShopifyOrderCount,
  calculateInventoryRetailValue,
  calculateInventoryCostValue,
  calculateInventoryUnitCount,
  countMeetingsThisWeek,
} from "../utils/calculations";

export function useDashboardStats(period: DashboardPeriod) {
  const dateRange = derivePeriodRange(period);

  const { customers, loading: customersLoading } = useCustomers();
  const { entries, loading: entriesLoading } = useJournalEntries(dateRange);
  const { products, loading: productsLoading } = useProducts();
  const { meetings, loading: meetingsLoading } = useMeetings();

  const loading = customersLoading || entriesLoading || productsLoading || meetingsLoading;

  return {
    shopifyRevenue: calculateShopifyRevenue(entries),
    shopifyOrders: calculateShopifyOrderCount(entries),
    inventoryRetailValue: calculateInventoryRetailValue(products),
    inventoryCostValue: calculateInventoryCostValue(products),
    inventoryUnits: calculateInventoryUnitCount(products),
    totalIncome: calculateTotalIncome(entries),
    activeCustomers: countActiveCustomers(customers),
    mrr: calculateMrr(customers),
    meetingsThisWeek: countMeetingsThisWeek(meetings),
    loading,
  };
}
