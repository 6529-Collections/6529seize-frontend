import { formatTime, formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";

/**
 * The UTC dates and times the models print, by locale (EXPLAINED.md §12:
 * dates in UTC, numbers by locale). Instants are seconds since 1970, as
 * the engine counts them.
 */
const toMs = (seconds: number) => seconds * 1000;

/** "19:05" */
export function utcClock(locale: SupportedLocale, seconds: number): string {
  return formatTime(locale, toMs(seconds), {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  });
}

/** "Oct 17" */
export function utcDay(locale: SupportedLocale, seconds: number): string {
  return formatUtcDate(locale, toMs(seconds), {
    month: "short",
    day: "numeric",
  });
}

/** "17": the day of the month, after a first label that names the month. */
export function utcDate(locale: SupportedLocale, seconds: number): string {
  return formatUtcDate(locale, toMs(seconds), { day: "numeric" });
}

/** "Sat, Oct 17" */
export function utcWeekday(locale: SupportedLocale, seconds: number): string {
  return formatUtcDate(locale, toMs(seconds), {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "Monday, Oct 19" */
export function utcLongWeekday(
  locale: SupportedLocale,
  seconds: number
): string {
  return formatUtcDate(locale, toMs(seconds), {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** "Oct 15, 2026" */
export function utcDayYear(locale: SupportedLocale, seconds: number): string {
  return formatUtcDate(locale, toMs(seconds), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Seconds from an ISO instant. */
export function secondsOf(iso: string): number {
  return Math.floor(Date.parse(iso) / 1000);
}
