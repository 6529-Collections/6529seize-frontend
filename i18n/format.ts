import { normalizeLocale, type SupportedLocale } from "@/i18n/locales";

const SHORT_DATE_FORMAT = {
  day: "numeric",
  month: "short",
  year: "numeric",
} satisfies Intl.DateTimeFormatOptions;
const SHORT_TIME_FORMAT = {
  hour: "2-digit",
  minute: "2-digit",
} satisfies Intl.DateTimeFormatOptions;
// A "YYYY-MM-DD" string names a calendar day, not an instant: it has no zone,
// so it must render as the same day for every viewer and every server zone.
const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const UTC_TIME_ZONE = "UTC";
const DEFAULT_RELATIVE_TIME_FORMAT_OPTIONS = {
  numeric: "auto",
} satisfies Intl.RelativeTimeFormatOptions;
const DEFAULT_COLLATOR_OPTIONS = {
  sensitivity: "base",
  numeric: true,
} satisfies Intl.CollatorOptions;
const DEFAULT_LIST_FORMAT_OPTIONS = {
  style: "long",
  type: "conjunction",
} satisfies Intl.ListFormatOptions;

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

/**
 * Parses a strict "YYYY-MM-DD" calendar date to the Date at 00:00 UTC of that
 * day. Returns null when the value is not a date-only string or names a day
 * that does not exist (for example 2026-02-30). Format the result with
 * `timeZone: "UTC"`; it is a carrier for the calendar day, not an instant.
 */
function parseCalendarDate(value: string): Date | null {
  const match = CALENDAR_DATE_PATTERN.exec(value);
  if (match === null) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  // setUTCFullYear, unlike Date.UTC, does not map years 0-99 onto 1900-1999.
  const date = new Date(0);
  date.setUTCFullYear(year, month, day);
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month &&
    date.getUTCDate() === day
    ? date
    : null;
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

export function formatDecimalString(
  locale: SupportedLocale,
  value: string | null | undefined
): string {
  if (value === null || value === undefined || value.trim().length === 0) {
    return "—";
  }

  const normalized = value.trim();
  const firstCharacter = normalized[0];
  const sign =
    firstCharacter === "+" || firstCharacter === "-" ? firstCharacter : "";
  const unsigned = sign ? normalized.slice(1) : normalized;
  const decimalIndex = unsigned.indexOf(".");
  const hasOneDecimalPoint =
    decimalIndex === unsigned.lastIndexOf(".") && decimalIndex >= 0;
  const integerPart = hasOneDecimalPoint
    ? unsigned.slice(0, decimalIndex)
    : unsigned;
  const fractionPart = hasOneDecimalPoint
    ? unsigned.slice(decimalIndex + 1)
    : undefined;
  const isDigits = (part: string): boolean =>
    part.length > 0 &&
    [...part].every((character) => character >= "0" && character <= "9");
  if (
    !isDigits(integerPart) ||
    (fractionPart !== undefined && !isDigits(fractionPart))
  ) {
    return normalized;
  }

  const integerFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    useGrouping: true,
  });
  const groupedInteger = integerFormatter.format(BigInt(integerPart));
  const decimalSeparator =
    new Intl.NumberFormat(locale)
      .formatToParts(1.1)
      .find((part) => part.type === "decimal")?.value ?? ".";
  const signedFormatter = new Intl.NumberFormat(locale, {
    signDisplay: "always",
    useGrouping: false,
  });
  let signValue = "";
  if (sign) {
    const signNumber = sign === "-" ? -1 : 1;
    const signPartType = sign === "-" ? "minusSign" : "plusSign";
    signValue =
      signedFormatter
        .formatToParts(signNumber)
        .find((part) => part.type === signPartType)?.value ?? sign;
  }
  const fractionSuffix =
    fractionPart === undefined ? "" : `${decimalSeparator}${fractionPart}`;

  return `${signValue}${groupedInteger}${fractionSuffix}`;
}

export function formatInteger(
  locale: SupportedLocale,
  value: number | null | undefined
): string {
  return formatNumber(locale, value, { maximumFractionDigits: 0 });
}

export function selectPluralCategory(
  locale: string | null | undefined,
  value: number
): Intl.LDMLPluralRule {
  const finiteValue = toFiniteNumber(value);
  return finiteValue === null
    ? "other"
    : new Intl.PluralRules(normalizeLocale(locale)).select(finiteValue);
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

/**
 * Formats a date for display.
 *
 * - A date-only string ("YYYY-MM-DD") is a calendar date. It always renders as
 *   that day, whatever the viewer's or server's zone: any `timeZone` in
 *   `options` is ignored and the value is never shifted. An impossible day
 *   such as 2026-02-30 renders as "-". It carries no time of day, so do not
 *   request time fields for it.
 * - Any other value is an instant. It renders in `options.timeZone`, or in the
 *   runtime's zone when none is given. Pass an explicit `timeZone` (or use
 *   `formatUtcDate`) wherever the output must not depend on the host zone, as
 *   in Server Components.
 */
export function formatDate(
  locale: SupportedLocale,
  value: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = SHORT_DATE_FORMAT
): string {
  if (typeof value === "string" && CALENDAR_DATE_PATTERN.test(value)) {
    const calendarDate = parseCalendarDate(value);
    return calendarDate === null
      ? "-"
      : new Intl.DateTimeFormat(locale, {
          ...options,
          timeZone: UTC_TIME_ZONE,
        }).format(calendarDate);
  }

  const date = toValidDate(value);
  if (date === null) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Formats the UTC calendar day of a value, independent of the runtime's zone.
 * Use it for instants that are published as UTC days (and for server-rendered
 * dates), so the server and every client print the same text.
 */
export function formatUtcDate(
  locale: SupportedLocale,
  value: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = SHORT_DATE_FORMAT
): string {
  return formatDate(locale, value, { ...options, timeZone: UTC_TIME_ZONE });
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

export function formatList(
  locale: SupportedLocale,
  values: readonly string[],
  options: Intl.ListFormatOptions = DEFAULT_LIST_FORMAT_OPTIONS
): string {
  return new Intl.ListFormat(locale, options).format(values);
}

export function roundTo(value: number, fractionDigits: number): number {
  const multiplier = 10 ** fractionDigits;
  return Math.round(value * multiplier) / multiplier;
}
