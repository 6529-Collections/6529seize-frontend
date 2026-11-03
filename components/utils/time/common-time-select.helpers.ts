import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";

export enum TimeMode {
  MINUTES = "MINUTES",
  HOURS = "HOURS",
  DAYS = "DAYS",
  WEEKS = "WEEKS",
  MONTHS = "MONTHS",
}

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAYS_PER_WEEK = 7;

/**
 * Adds calendar months in the viewer's zone, keeping the wall-clock time and
 * clamping the day to the end of the target month (Jan 31 + 1 month is the
 * last day of February, never early March). The result is built in one step
 * from local parts so no intermediate date can overflow or hit a DST gap.
 * Zero months returns the same instant: rebuilding from local parts would map
 * the second occurrence of a repeated fall-back hour onto the first one.
 */
function addCalendarMonths(date: Date, months: number): Date {
  if (months === 0) return new Date(date);
  const firstOfTargetMonth = new Date(
    date.getFullYear(),
    date.getMonth() + months,
    1
  );
  const year = firstOfTargetMonth.getFullYear();
  const month = firstOfTargetMonth.getMonth();
  const lastDayOfTargetMonth = new Date(year, month + 1, 0).getDate();
  return new Date(
    year,
    month,
    Math.min(date.getDate(), lastDayOfTargetMonth),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );
}

/**
 * Minutes and hours are exact elapsed time, so a DST change cannot shift them.
 * Days and weeks keep the same local wall-clock time on the target day, and
 * months additionally clamp to the end of the target month.
 */
export function getExpiryMillis(
  mode: TimeMode,
  value: number,
  now: Date = new Date()
): number {
  switch (mode) {
    case TimeMode.MINUTES:
      return now.getTime() + value * MINUTE_MS;
    case TimeMode.HOURS:
      return now.getTime() + value * HOUR_MS;
    case TimeMode.DAYS:
      return addCalendarDays(now, value).getTime();
    case TimeMode.WEEKS:
      return addCalendarDays(now, value * DAYS_PER_WEEK).getTime();
    case TimeMode.MONTHS:
      return addCalendarMonths(now, value).getTime();
    default:
      return assertUnreachable(mode);
  }
}

function addCalendarDays(date: Date, days: number): Date {
  // Same reason as zero months: setDate would re-resolve a repeated local hour.
  if (days === 0) return new Date(date);
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
