import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import { Customer } from "./customer";

const validCustomer = {
  id: "cust_1",
  name: "Acme AB",
  location: "Stockholm, Sweden",
  phone: "+46701234567",
  email: "info@acme.se",
  status: "not_contacted" as const,
  categoryOfWork: "IT Consulting",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

describe("Customer schema", () => {
  it("should accept a valid customer with required fields", () => {
    const result = Schema.decodeUnknownEither(Customer)(validCustomer);
    expect(result._tag).toBe("Right");
  });

  it("should accept a customer with all optional fields", () => {
    const full = {
      ...validCustomer,
      description: "A great company",
      website: "https://acme.se",
      orgNumber: "556677-8899",
      legalName: "Acme Aktiebolag",
    };
    const result = Schema.decodeUnknownEither(Customer)(full);
    expect(result._tag).toBe("Right");
  });

  it("should reject a customer missing required name", () => {
    const { name: _, ...missing } = validCustomer;
    const result = Schema.decodeUnknownEither(Customer)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject a customer missing required location", () => {
    const { location: _, ...missing } = validCustomer;
    const result = Schema.decodeUnknownEither(Customer)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject a customer missing required email", () => {
    const { email: _, ...missing } = validCustomer;
    const result = Schema.decodeUnknownEither(Customer)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject a customer missing required phone", () => {
    const { phone: _, ...missing } = validCustomer;
    const result = Schema.decodeUnknownEither(Customer)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject an invalid status value", () => {
    const invalid = { ...validCustomer, status: "unknown_status" };
    const result = Schema.decodeUnknownEither(Customer)(invalid);
    expect(result._tag).toBe("Left");
  });

  it("should accept all valid status values", () => {
    const statuses = [
      "not_contacted",
      "contacted",
      "in_progress",
      "warm",
      "mrr",
      "completed",
      "lost",
    ] as const;

    for (const status of statuses) {
      const result = Schema.decodeUnknownEither(Customer)({
        ...validCustomer,
        status,
      });
      expect(result._tag).toBe("Right");
    }
  });
});
