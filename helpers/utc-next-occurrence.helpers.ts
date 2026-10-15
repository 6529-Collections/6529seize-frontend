/** A wall-clock time in UTC, such as 16:00. */
export interface UtcTimeOfDay {
  readonly hour: number;
  readonly minute: number;
}

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const DAYS_IN_WEEK = 7;

/**
 * The first instant at or after `nowMs` that falls on `utcWeekday` (0 =
 * Sunday) at `time` UTC. Returns null for a weekday outside 0-6.
 */
export function getNextUtcOccurrence(
  time: UtcTimeOfDay,
  utcWeekday: number,
  nowMs: number
): number | null {
  const now = new Date(nowMs);
  const startOfUtcDay = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const timeOfDayMs = time.hour * MS_PER_HOUR + time.minute * MS_PER_MINUTE;

  for (let offset = 0; offset <= DAYS_IN_WEEK; offset += 1) {
    const candidate = startOfUtcDay + offset * MS_PER_DAY + timeOfDayMs;
    if (candidate >= nowMs && new Date(candidate).getUTCDay() === utcWeekday) {
      return candidate;
    }
  }
  return null;
}
