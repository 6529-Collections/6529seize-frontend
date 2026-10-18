import {
  formatInteger,
  formatNumber,
  formatTime,
  formatUtcDate,
} from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";

/**
 * How the facts layer prints values (EXPLAINED.md §6.1). Dates are UTC,
 * numbers follow the locale, and hashes are never localized.
 */

const UTC_CLOCK: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
};

/** "09:40 UTC" */
export function formatUtcClock(locale: SupportedLocale, iso: string): string {
  const clock = formatTime(locale, iso, UTC_CLOCK);
  return clock === "" ? "-" : `${clock} UTC`;
}

/** "Oct 18" */
export function formatUtcDay(locale: SupportedLocale, iso: string): string {
  return formatUtcDate(locale, iso, { month: "short", day: "numeric" });
}

/** "Sun Oct 18" */
export function formatUtcWeekday(locale: SupportedLocale, iso: string): string {
  return formatUtcDate(locale, iso, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "October 18, 2026" */
export function formatUtcLongDay(locale: SupportedLocale, iso: string): string {
  return formatUtcDate(locale, iso, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** "2026-10-18 00:49:01 UTC": an instant in full, as the feed writes it. */
export function formatUtcInstant(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return `${date.toISOString().slice(0, 19).replace("T", " ")} UTC`;
}

export function formatCount(locale: SupportedLocale, value: number): string {
  return formatInteger(locale, value);
}

/** A signed count: "+2,951,745". */
export function formatSignedCount(
  locale: SupportedLocale,
  value: number
): string {
  return formatNumber(locale, value, {
    maximumFractionDigits: 0,
    signDisplay: "exceptZero",
  });
}

/** A rate or a boost, to the cent: "12.71", "1.05". */
export function formatCents(locale: SupportedLocale, value: number): string {
  return formatNumber(locale, value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** "0x63e242fa…163bcf22": the first and last bytes of a hash, never localized. */
export function shortHash(
  value: string,
  bytes: readonly [number, number] = [4, 4]
): string {
  const prefixed = value.startsWith("0x");
  const hex = prefixed ? value.slice(2) : value;
  const [head, tail] = bytes;
  if (hex.length <= (head + tail) * 2) {
    return value;
  }
  return `${prefixed ? "0x" : ""}${hex.slice(0, head * 2)}…${hex.slice(-tail * 2)}`;
}

/** "0d25aa6": a commit as the pages cite it. */
export function shortCommit(value: string): string {
  return value.slice(0, 7);
}

/** "8 min 22 s", "11.7 s": a program's run time. */
export function formatRuntime(locale: SupportedLocale, ms: number): string {
  if (ms < 60_000) {
    return `${formatNumber(locale, ms / 1000, { maximumFractionDigits: 1 })} s`;
  }
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${formatInteger(locale, minutes)} min ${formatInteger(locale, seconds)} s`;
}

/** Whole minutes between two instants (later minus earlier), never negative. */
export function minutesBetween(earlier: string, later: string): number {
  const ms = new Date(later).getTime() - new Date(earlier).getTime();
  return Number.isFinite(ms) ? Math.max(0, Math.round(ms / 60_000)) : 0;
}
