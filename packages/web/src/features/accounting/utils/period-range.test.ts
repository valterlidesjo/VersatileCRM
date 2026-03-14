import { describe, it, expect } from "vitest";
import { derivePeriodRange } from "./period-range";

const d = (s: string) => new Date(s);

describe("derivePeriodRange", () => {
  describe("this-month", () => {
    it("returns correct range for a mid-month date", () => {
      expect(derivePeriodRange("this-month", d("2026-03-14"))).toEqual({
        start: "2026-03-01",
        afterEnd: "2026-04-01",
      });
    });

    it("handles December → wraps to next year", () => {
      expect(derivePeriodRange("this-month", d("2025-12-31"))).toEqual({
        start: "2025-12-01",
        afterEnd: "2026-01-01",
      });
    });
  });

  describe("last-month", () => {
    it("returns previous month range", () => {
      expect(derivePeriodRange("last-month", d("2026-03-14"))).toEqual({
        start: "2026-02-01",
        afterEnd: "2026-03-01",
      });
    });

    it("handles January → wraps to previous year December", () => {
      expect(derivePeriodRange("last-month", d("2026-01-15"))).toEqual({
        start: "2025-12-01",
        afterEnd: "2026-01-01",
      });
    });

    it("handles February correctly (short month, no off-by-one)", () => {
      expect(derivePeriodRange("last-month", d("2026-03-01"))).toEqual({
        start: "2026-02-01",
        afterEnd: "2026-03-01",
      });
    });
  });

  describe("this-quarter", () => {
    it("Q1: Jan–Mar", () => {
      expect(derivePeriodRange("this-quarter", d("2026-03-14"))).toEqual({
        start: "2026-01-01",
        afterEnd: "2026-04-01",
      });
    });

    it("Q2: Apr–Jun", () => {
      expect(derivePeriodRange("this-quarter", d("2026-05-01"))).toEqual({
        start: "2026-04-01",
        afterEnd: "2026-07-01",
      });
    });

    it("Q3: Jul–Sep", () => {
      expect(derivePeriodRange("this-quarter", d("2026-08-15"))).toEqual({
        start: "2026-07-01",
        afterEnd: "2026-10-01",
      });
    });

    it("Q4: Oct–Dec wraps afterEnd to next year", () => {
      expect(derivePeriodRange("this-quarter", d("2026-10-01"))).toEqual({
        start: "2026-10-01",
        afterEnd: "2027-01-01",
      });
    });
  });

  describe("last-quarter", () => {
    it("Q1 → previous Q4 (cross-year)", () => {
      expect(derivePeriodRange("last-quarter", d("2026-03-14"))).toEqual({
        start: "2025-10-01",
        afterEnd: "2026-01-01",
      });
    });

    it("Q2 → Q1 same year", () => {
      expect(derivePeriodRange("last-quarter", d("2026-04-05"))).toEqual({
        start: "2026-01-01",
        afterEnd: "2026-04-01",
      });
    });

    it("Q3 → Q2", () => {
      expect(derivePeriodRange("last-quarter", d("2026-07-01"))).toEqual({
        start: "2026-04-01",
        afterEnd: "2026-07-01",
      });
    });

    it("Q4 → Q3", () => {
      expect(derivePeriodRange("last-quarter", d("2026-10-20"))).toEqual({
        start: "2026-07-01",
        afterEnd: "2026-10-01",
      });
    });
  });
});
