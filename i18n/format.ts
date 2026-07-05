import type { SupportedLocale } from "@/i18n/locales";

const SHORT_DATE_FORMAT = {
  day: "numeric",
  month: "short",
  year: "numeric",
} satisfies Intl.DateTimeFormatOptions;
const SHORT_TIME_FORMAT = {
  hour: "2-digit",
  minute: "2-digit",
} satisfies Intl.DateTimeFormatOptions;
const DEFAULT_RELATIVE_TIME_FORMAT_OPTIONS = {
  numeric: "auto",
} satisfies Intl.RelativeTimeFormatOptions;
const DEFAULT_COLLATOR_OPTIONS = {
  sensitivity: "base",
  numeric: true,
} satisfies Intl.CollatorOptions;

function toFiniteNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toValidDate(value: Date | string | number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatNumber(
  locale: SupportedLocale,
  value: number | null | undefined,
  options: Intl.NumberFormatOptions = {}
): string {
  const numberValue = toFiniteNumber(value);
  if (numberValue === null) {
    return "-";
  }

  return new Intl.NumberFormat(locale, options).format(numberValue);
}

export function formatInteger(
  locale: SupportedLocale,
  value: number | null | undefined
): string {
  return formatNumber(locale, value, { maximumFractionDigits: 0 });
}

export function formatPercent(
  locale: SupportedLocale,
  value: number | null | undefined,
  maximumFractionDigits = 1
): string {
  return formatNumber(locale, value, {
    style: "percent",
    maximumFractionDigits,
  });
}

export function formatDate(
  locale: SupportedLocale,
  value: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = SHORT_DATE_FORMAT
): string {
  const date = toValidDate(value);
  if (date === null) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale, options).format(date);
}

// Returns "" (not "-") so callers rendering optional time suffixes can omit
// them entirely when the value is invalid.
export function formatTime(
  locale: SupportedLocale,
  value: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = SHORT_TIME_FORMAT
): string {
  const date = toValidDate(value);
  if (date === null) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatRelativeTime(
  locale: SupportedLocale,
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  options: Intl.RelativeTimeFormatOptions = DEFAULT_RELATIVE_TIME_FORMAT_OPTIONS
): string {
  return new Intl.RelativeTimeFormat(locale, options).format(value, unit);
}

export function compareLocalized(
  locale: SupportedLocale,
  left: string,
  right: string,
  options: Intl.CollatorOptions = DEFAULT_COLLATOR_OPTIONS
): number {
  return new Intl.Collator(locale, options).compare(left, right);
}

export function roundTo(value: number, fractionDigits: number): number {
  const multiplier = 10 ** fractionDigits;
  return Math.round(value * multiplier) / multiplier;
}
