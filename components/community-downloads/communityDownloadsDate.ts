import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";

const DOWNLOAD_DATE_FORMAT = {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
} satisfies Intl.DateTimeFormatOptions;

// "20261012": the compact day the TDH and consolidated upload feeds use.
const COMPACT_DATE_PATTERN = /^\d{8}$/;
// "2023-05-10 11:44:03": a zone-less timestamp, which keeps the day it names.
const ZONELESS_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/;
// "2026-10-11T00:00:00.000Z": the royalties feed stamps a day as UTC midnight.
const UTC_MIDNIGHT_SUFFIXES = ["T00:00:00.000Z", "T00:00:00Z"];
const ISO_DAY_LENGTH = "YYYY-MM-DD".length;

function toCalendarDate(value: string): string | null {
  if (COMPACT_DATE_PATTERN.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`;
  }

  const isDayOfTimestamp =
    ZONELESS_TIMESTAMP_PATTERN.test(value) ||
    UTC_MIDNIGHT_SUFFIXES.some((suffix) => value.endsWith(suffix));
  return isDayOfTimestamp ? value.slice(0, ISO_DAY_LENGTH) : null;
}

/**
 * Formats the Date column of the Open Data download tables. The feeds name a
 * day as "YYYYMMDD", "YYYY-MM-DD", a UTC-midnight timestamp or a zone-less
 * timestamp; all of them render as that calendar day for every viewer. Any
 * other value is a real instant (for example an upload time) and renders in
 * the viewer's zone.
 */
export function formatDownloadDate(
  locale: SupportedLocale,
  value: string
): string {
  return formatDate(
    locale,
    toCalendarDate(value) ?? value,
    DOWNLOAD_DATE_FORMAT
  );
}
