import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import { CompanyProfile } from "./profile";

const validProfile = {
  id: "prof_1",
  orgNumber: "556677-8899",
  legalName: "Acme Aktiebolag",
  bank: "Swedbank",
  bankgiro: "123-4567",
  fSkatt: true,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

describe("CompanyProfile schema", () => {
  it("should accept a valid profile with required fields", () => {
    const result = Schema.decodeUnknownEither(CompanyProfile)(validProfile);
    expect(result._tag).toBe("Right");
  });

  it("should accept a profile with all optional fields", () => {
    const full = {
      ...validProfile,
      website: "https://acme.se",
      incomeGoal: 600000,
      mrrGoal: 60000,
      goalDeadline: "2026-12-31",
      goalDescription: "Become the leading consulting firm in Sweden",
    };
    const result = Schema.decodeUnknownEither(CompanyProfile)(full);
    expect(result._tag).toBe("Right");
  });

  it("should accept numeric goal values", () => {
    const withGoals = {
      ...validProfile,
      incomeGoal: 1000000,
      mrrGoal: 100000,
    };
    const result = Schema.decodeUnknownEither(CompanyProfile)(withGoals);
    expect(result._tag).toBe("Right");
  });

  it("should reject non-numeric incomeGoal", () => {
    const invalid = { ...validProfile, incomeGoal: "600000" };
    const result = Schema.decodeUnknownEither(CompanyProfile)(invalid);
    expect(result._tag).toBe("Left");
  });

  it("should reject a profile missing required orgNumber", () => {
    const { orgNumber: _, ...missing } = validProfile;
    const result = Schema.decodeUnknownEither(CompanyProfile)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject a profile missing required legalName", () => {
    const { legalName: _, ...missing } = validProfile;
    const result = Schema.decodeUnknownEither(CompanyProfile)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject a profile missing required bank", () => {
    const { bank: _, ...missing } = validProfile;
    const result = Schema.decodeUnknownEither(CompanyProfile)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject a profile missing required bankgiro", () => {
    const { bankgiro: _, ...missing } = validProfile;
    const result = Schema.decodeUnknownEither(CompanyProfile)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject a non-boolean fSkatt value", () => {
    const invalid = { ...validProfile, fSkatt: "yes" };
    const result = Schema.decodeUnknownEither(CompanyProfile)(invalid);
    expect(result._tag).toBe("Left");
  });

  it("should accept fSkatt as false", () => {
    const result = Schema.decodeUnknownEither(CompanyProfile)({
      ...validProfile,
      fSkatt: false,
    });
    expect(result._tag).toBe("Right");
  });
});
