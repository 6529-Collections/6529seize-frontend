import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";

/** "15 October 2026"-style date for a "YYYY-MM-DD" UTC calendar day. */
export function formatCycleDate(locale: SupportedLocale, date: string): string {
  return formatDate(locale, date, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortCycleDate(
  locale: SupportedLocale,
  date: string
): string {
  return formatDate(locale, date, { day: "numeric", month: "short" });
}

/** Shortens a long identifier in the middle: 0x74b4a8…84c663d3. */
export function middleTruncate(value: string, keep = 8): string {
  return value.length <= keep * 2 + 1
    ? value
    : `${value.slice(0, keep)}…${value.slice(-keep)}`;
}

/**
 * A code version as the feed gives it, shortened: "db72daa", "db72daa+wip"
 * (built from a tree with local changes) or "unknown".
 */
export function shortCommit(commit: string): string {
  if (commit === "unknown") {
    return commit;
  }
  const wip = commit.endsWith("+wip");
  const hex = wip ? commit.slice(0, -4) : commit;
  return `${hex.slice(0, 7)}${wip ? "+wip" : ""}`;
}
