import {
  formatDate,
  formatInteger,
  formatNumber,
  formatPercent,
} from "@/i18n/format";
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

/**
 * A signed integer with a real minus sign: "+240", "−240" or "0". Intl uses
 * the hyphen-minus for negative numbers in English.
 */
export function formatSigned(locale: SupportedLocale, value: number): string {
  return formatNumber(locale, value, {
    signDisplay: "exceptZero",
    maximumFractionDigits: 0,
  }).replace("-", "−");
}

/** An agreement share with two decimals, so 10,280 of 10,282 is not 100%. */
export function formatShare(locale: SupportedLocale, share: number): string {
  const digits = share < 1 && share >= 0.9999 ? 3 : 2;
  return formatPercent(
    locale,
    Math.floor(share * 10 ** (digits + 2)) / 10 ** (digits + 2),
    digits
  );
}

export { formatInteger };

/** Shortens a long identifier in the middle: 0x74b4a8…84c663d3. */
export function middleTruncate(value: string, keep = 8): string {
  return value.length <= keep * 2 + 1
    ? value
    : `${value.slice(0, keep)}…${value.slice(-keep)}`;
}
