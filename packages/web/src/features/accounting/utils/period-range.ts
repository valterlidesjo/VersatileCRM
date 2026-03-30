export type Period =
  | "this-month"
  | "last-month"
  | "this-quarter"
  | "last-quarter"
  | "last-30-days"
  | "last-90-days"
  | "last-365-days"
  | "all-time";

/** Subset of Period used by the dashboard time-period toggle. */
export type DashboardPeriod = "last-30-days" | "last-90-days" | "last-365-days" | "all-time";

export interface DateRange {
  /** First day of period, inclusive — YYYY-MM-DD */
  start: string;
  /** First day of next period, exclusive — YYYY-MM-DD */
  afterEnd: string;
}

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function subtractDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return toISODate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function tomorrowOf(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return toISODate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/**
 * Returns a date range for the given period.
 * Uses an exclusive upper bound (afterEnd) so that both YYYY-MM-DD and
 * ISO datetime strings are handled correctly by Firestore range queries:
 *   where("date", ">=", start) + where("date", "<", afterEnd)
 *
 * Rolling windows (last-30-days etc.) use today as the upper boundary,
 * so they always include today's entries.
 *
 * @param period - The period to derive a range for
 * @param today  - Reference date (defaults to now; injectable for testing)
 */
export function derivePeriodRange(period: Period, today = new Date()): DateRange | undefined {
  if (period === "all-time") return undefined;

  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 1-12

  switch (period) {
    case "this-month":
      return {
        start: toISODate(year, month, 1),
        afterEnd:
          month === 12
            ? toISODate(year + 1, 1, 1)
            : toISODate(year, month + 1, 1),
      };

    case "last-month": {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      return {
        start: toISODate(prevYear, prevMonth, 1),
        afterEnd: toISODate(year, month, 1),
      };
    }

    case "this-quarter": {
      // quarterStart: 1 (Q1), 4 (Q2), 7 (Q3), 10 (Q4)
      const qStart = Math.floor((month - 1) / 3) * 3 + 1;
      const qAfterMonth = qStart + 3;
      return {
        start: toISODate(year, qStart, 1),
        afterEnd:
          qAfterMonth > 12
            ? toISODate(year + 1, 1, 1)
            : toISODate(year, qAfterMonth, 1),
      };
    }

    case "last-quarter": {
      const qStart = Math.floor((month - 1) / 3) * 3 + 1;
      const prevQStart = qStart === 1 ? 10 : qStart - 3;
      const prevQYear = qStart === 1 ? year - 1 : year;
      return {
        start: toISODate(prevQYear, prevQStart, 1),
        afterEnd: toISODate(year, qStart, 1),
      };
    }

    // Rolling windows: start = today - N days, afterEnd = tomorrow (inclusive of today)
    case "last-30-days":
      return { start: subtractDays(today, 30), afterEnd: tomorrowOf(today) };

    case "last-90-days":
      return { start: subtractDays(today, 90), afterEnd: tomorrowOf(today) };

    case "last-365-days":
      return { start: subtractDays(today, 365), afterEnd: tomorrowOf(today) };
  }
}
