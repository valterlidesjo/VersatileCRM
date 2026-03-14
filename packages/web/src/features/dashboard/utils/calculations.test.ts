import { describe, it, expect } from "vitest";
import type { Customer, JournalEntry } from "@crm/shared";
import {
  countActiveCustomers,
  calculateMrr,
  calculateTotalIncome,
} from "./calculations";

const makeCustomer = (
  status: Customer["status"],
  mrr?: number
): Customer => ({
  id: "c1",
  name: "Test Co",
  location: "Stockholm",
  phone: "+46701234567",
  email: "test@example.com",
  status,
  categoryOfWork: "IT",
  ...(mrr !== undefined && { mrr }),
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
});

const makeJournalEntry = (
  transactionType: "income" | "cost",
  totalAmount: number
): JournalEntry => ({
  id: "je1",
  date: "2025-01-01",
  description: "Test entry",
  transactionType,
  category: "sales",
  totalAmount,
  vatRate: "25",
  vatAmount: totalAmount * 0.25,
  lines: [],
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
});

describe("countActiveCustomers", () => {
  it("should count customers with mrr status", () => {
    const customers = [makeCustomer("mrr"), makeCustomer("lost")];
    expect(countActiveCustomers(customers)).toBe(1);
  });

  it("should count customers with in_progress status", () => {
    const customers = [makeCustomer("in_progress"), makeCustomer("contacted")];
    expect(countActiveCustomers(customers)).toBe(1);
  });

  it("should count both mrr and in_progress", () => {
    const customers = [
      makeCustomer("mrr"),
      makeCustomer("in_progress"),
      makeCustomer("warm"),
    ];
    expect(countActiveCustomers(customers)).toBe(2);
  });

  it("should return 0 for empty array", () => {
    expect(countActiveCustomers([])).toBe(0);
  });

  it("should return 0 when no active customers", () => {
    const customers = [
      makeCustomer("not_contacted"),
      makeCustomer("lost"),
      makeCustomer("completed"),
    ];
    expect(countActiveCustomers(customers)).toBe(0);
  });
});

describe("calculateMrr", () => {
  it("should sum MRR from customers with mrr status and mrr value", () => {
    const customers = [
      makeCustomer("mrr", 10000),
      makeCustomer("mrr", 5000),
    ];
    expect(calculateMrr(customers)).toBe(15000);
  });

  it("should exclude customers without mrr status", () => {
    const customers = [
      makeCustomer("mrr", 10000),
      makeCustomer("in_progress", 5000),
      makeCustomer("warm", 3000),
    ];
    expect(calculateMrr(customers)).toBe(10000);
  });

  it("should exclude customers with mrr status but no mrr value", () => {
    const customers = [
      makeCustomer("mrr", 10000),
      makeCustomer("mrr"), // no mrr value
    ];
    expect(calculateMrr(customers)).toBe(10000);
  });

  it("should return 0 for empty array", () => {
    expect(calculateMrr([])).toBe(0);
  });

  it("should return 0 when no customers have mrr status", () => {
    const customers = [
      makeCustomer("contacted", 5000),
      makeCustomer("warm", 3000),
    ];
    expect(calculateMrr(customers)).toBe(0);
  });
});

describe("calculateTotalIncome", () => {
  it("should sum all income journal entries", () => {
    const entries = [
      makeJournalEntry("income", 10000),
      makeJournalEntry("income", 5000),
    ];
    expect(calculateTotalIncome(entries)).toBe(15000);
  });

  it("should exclude cost entries", () => {
    const entries = [
      makeJournalEntry("income", 10000),
      makeJournalEntry("cost", 5000),
      makeJournalEntry("income", 3000),
    ];
    expect(calculateTotalIncome(entries)).toBe(13000);
  });

  it("should return 0 for empty array", () => {
    expect(calculateTotalIncome([])).toBe(0);
  });

  it("should return 0 when no income entries", () => {
    const entries = [
      makeJournalEntry("cost", 5000),
      makeJournalEntry("cost", 3000),
    ];
    expect(calculateTotalIncome(entries)).toBe(0);
  });
});
