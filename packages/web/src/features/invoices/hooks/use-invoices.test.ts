import { describe, it, expect } from "vitest";
import { generateInvoiceRef } from "./use-invoices";

describe("generateInvoiceRef", () => {
  it("returns a 4-character string", () => {
    const ref = generateInvoiceRef();
    expect(ref).toHaveLength(4);
  });

  it("contains only alphanumeric characters", () => {
    for (let i = 0; i < 50; i++) {
      const ref = generateInvoiceRef();
      expect(ref).toMatch(/^[A-Za-z0-9]{4}$/);
    }
  });

  it("produces different values across calls", () => {
    const refs = new Set<string>();
    for (let i = 0; i < 20; i++) {
      refs.add(generateInvoiceRef());
    }
    // With 62^4 = 14.7M possibilities, 20 calls should be unique
    expect(refs.size).toBeGreaterThan(1);
  });
});
