import type { Customer, JournalEntry } from "@crm/shared";

export function countActiveCustomers(customers: Customer[]): number {
  return customers.filter(
    (c) => c.status === "mrr" || c.status === "in_progress"
  ).length;
}

export function calculateMrr(customers: Customer[]): number {
  return customers
    .filter((c) => c.status === "mrr" && c.mrr)
    .reduce((sum, c) => sum + (c.mrr ?? 0), 0);
}

export function calculateTotalIncome(entries: JournalEntry[]): number {
  return entries
    .filter((e) => e.transactionType === "income")
    .reduce((sum, e) => sum + e.totalAmount, 0);
}
