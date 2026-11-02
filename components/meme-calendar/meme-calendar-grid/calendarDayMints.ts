import {
  isMintEligibleUtcDay,
  mintStartInstantUtcForMintDay,
} from "../meme-calendar.helpers";
import { getHistoricalMintsOnUtcDay } from "../meme-calendar.szn1";
import { calendarDayInZone } from "../meme-calendar.zone";
import type { HistoricalMint } from "./types";

// The mint schedule assigns mints to UTC days. Every zone is less than a day
// from UTC, so a mint shown on a calendar date in any zone was scheduled on
// the UTC day before, on or after that date.
const NEIGHBOURING_UTC_DAY_OFFSETS = [-1, 0, 1] as const;

interface ScheduledCalendarDayMint {
  /** The UTC day the schedule (and its overrides) assigns the mint to. */
  readonly utcDay: Date;
  readonly instantUtc: Date;
}

function getNeighbouringUtcDays(calendarDay: Date): Date[] {
  return NEIGHBOURING_UTC_DAY_OFFSETS.map(
    (offset) =>
      new Date(
        Date.UTC(
          calendarDay.getUTCFullYear(),
          calendarDay.getUTCMonth(),
          calendarDay.getUTCDate() + offset
        )
      )
  );
}

function startsOnCalendarDay(
  instant: Date,
  calendarDay: Date,
  timeZone: string
): boolean {
  return (
    calendarDayInZone(instant, timeZone).getTime() === calendarDay.getTime()
  );
}

/**
 * SZN1 mints whose start falls on `calendarDay` (00:00 UTC of a calendar
 * date) in `timeZone`, in mint order.
 */
export function getHistoricalMintsOnCalendarDay(
  calendarDay: Date,
  timeZone: string
): HistoricalMint[] {
  return getNeighbouringUtcDays(calendarDay)
    .flatMap((utcDay) => getHistoricalMintsOnUtcDay(utcDay))
    .filter((mint) =>
      startsOnCalendarDay(mint.instantUtc, calendarDay, timeZone)
    );
}

/**
 * The scheduled mint whose start falls on `calendarDay` (00:00 UTC of a
 * calendar date) in `timeZone`, if any. Mints on consecutive UTC days start
 * about 24 hours apart, so a date holds at most one unless a daylight-saving
 * change falls between two consecutive mint days; then the earlier is used.
 */
export function getScheduledMintOnCalendarDay(
  calendarDay: Date,
  timeZone: string
): ScheduledCalendarDayMint | undefined {
  for (const utcDay of getNeighbouringUtcDays(calendarDay)) {
    if (!isMintEligibleUtcDay(utcDay)) {
      continue;
    }
    const instantUtc = mintStartInstantUtcForMintDay(utcDay);
    if (startsOnCalendarDay(instantUtc, calendarDay, timeZone)) {
      return { utcDay, instantUtc };
    }
  }
  return undefined;
}
