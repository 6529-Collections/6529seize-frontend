import { NEVER_DATE } from "@/constants/constants";
import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const SECOND_MS = 1000;
const HOUR_MS = 60 * 60 * SECOND_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Smallest gap between submitting a delegation and its expiry. It leaves time
 * for wallet confirmation and block inclusion, so the delegation is still
 * active when the transaction confirms.
 */
export const DELEGATION_EXPIRY_MIN_LEAD_MS = HOUR_MS;

const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIN_EXPIRY_YEAR = 1970;
// Fixed Gregorian calendar and Latin digits so the parts parse as numbers.
const DATE_PARTS_LOCALE = "en-US-u-ca-gregory-nu-latn";

const LOCAL_EXPIRY_FORMAT = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
} satisfies Intl.DateTimeFormatOptions;
const UTC_EXPIRY_FORMAT = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
  timeZoneName: "short",
} satisfies Intl.DateTimeFormatOptions;

/** The delegation form's expiry choice and the instant it resolves to. */
export interface DelegationExpirySelection {
  /** The native date input value (`YYYY-MM-DD`), or "" when empty. */
  readonly date: string;
  /** Unix seconds of the last second of `date` in the viewer's zone. */
  readonly expiresAt: number | null;
}

export const EMPTY_DELEGATION_EXPIRY: DelegationExpirySelection = {
  date: "",
  expiresAt: null,
};

interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/** The viewer's IANA time zone, for example `America/Los_Angeles`. */
export function getViewerTimeZone(): string {
  // The picker, preview and expiry displays all read this, so the UTC
  // fallback stays self-consistent: values resolve and display in one zone.
  return new Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/**
 * On-chain expiry values that mean "never expires": 0 and `NEVER_DATE`
 * (year 4000) or later.
 */
export function isNonExpiringDelegationExpiry(expiresAt: number): boolean {
  return expiresAt === 0 || expiresAt >= NEVER_DATE;
}

function parseDateInput(value: string): CalendarDate | null {
  const match = DATE_INPUT_PATTERN.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day;
  return year >= MIN_EXPIRY_YEAR && isRealDate ? { year, month, day } : null;
}

function createDatePartsFormatter(timeZone: string) {
  return new Intl.DateTimeFormat(DATE_PARTS_LOCALE, {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

function getZonedCalendarDate(
  formatter: Intl.DateTimeFormat,
  epochMs: number
): CalendarDate {
  const parts = formatter.formatToParts(epochMs);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}

function toDateKey(date: CalendarDate): number {
  return date.year * 10_000 + date.month * 100 + date.day;
}

/**
 * The first whole second whose wall-clock date in the formatter's zone is on
 * or after `date`. Intl supplies every offset and daylight-saving rule, so
 * days that start at 01:00, repeat an hour or skip one resolve correctly.
 */
function getZonedDateStartMs(
  date: CalendarDate,
  formatter: Intl.DateTimeFormat
): number {
  const target = toDateKey(date);
  const wallMidnightMs = Date.UTC(date.year, date.month - 1, date.day);
  // UTC offsets stay well inside one day, so the zone's date is still before
  // `date` at `low` and has reached it at `high`. The zone's calendar date
  // never moves backwards as time advances, so a binary search finds the
  // boundary.
  let low = wallMidnightMs - DAY_MS;
  let high = wallMidnightMs + DAY_MS;
  while (high - low > SECOND_MS) {
    const middle = low + Math.floor((high - low) / (2 * SECOND_MS)) * SECOND_MS;
    if (toDateKey(getZonedCalendarDate(formatter, middle)) >= target) {
      high = middle;
    } else {
      low = middle;
    }
  }
  return high;
}

/**
 * Unix seconds of the last second (23:59:59 on an ordinary day) of a
 * `YYYY-MM-DD` calendar date in an IANA time zone. Returns null for input
 * that is not a real date, or for a date the zone skips entirely.
 */
export function getZonedDateEndEpochSeconds(
  value: string,
  timeZone: string
): number | null {
  const date = parseDateInput(value);
  if (!date) {
    return null;
  }
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + 1));
  const formatter = createDatePartsFormatter(timeZone);
  const endMs =
    getZonedDateStartMs(
      {
        year: next.getUTCFullYear(),
        month: next.getUTCMonth() + 1,
        day: next.getUTCDate(),
      },
      formatter
    ) - SECOND_MS;
  const endsOnDate =
    toDateKey(getZonedCalendarDate(formatter, endMs)) === toDateKey(date);
  return endsOnDate ? endMs / SECOND_MS : null;
}

/**
 * The earliest `YYYY-MM-DD` date whose end in `timeZone` is more than the
 * minimum lead time after `nowMs`. Every earlier date would be refused.
 */
export function getMinDelegationExpiryDate(
  nowMs: number,
  timeZone: string
): string {
  // The day containing this instant ends less than a second before it at the
  // earliest, so strictly after the lead time; the day before ends too soon.
  const earliestMs = nowMs + DELEGATION_EXPIRY_MIN_LEAD_MS + SECOND_MS;
  const date = getZonedCalendarDate(
    createDatePartsFormatter(timeZone),
    earliestMs
  );
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
}

/**
 * The error for an expiry choice, or null when it can be sent. Without
 * `submittedAtMs` (render-time gating) only presence is checked; the submit
 * handler passes the click time, so the lead time is measured from submit.
 */
export function getDelegationExpiryError(
  locale: SupportedLocale,
  expiresAt: number | null,
  submittedAtMs?: number
): string | null {
  if (expiresAt === null) {
    return t(locale, "delegation.expiry.error.missing");
  }
  if (
    submittedAtMs !== undefined &&
    expiresAt * SECOND_MS <= submittedAtMs + DELEGATION_EXPIRY_MIN_LEAD_MS
  ) {
    return t(locale, "delegation.expiry.error.tooSoon");
  }
  return null;
}

/** An expiry instant in the viewer's zone, with the zone's short name. */
export function formatDelegationExpiryLocal(
  locale: SupportedLocale,
  expiresAt: number,
  timeZone: string
): string {
  return formatDate(locale, expiresAt * SECOND_MS, {
    ...LOCAL_EXPIRY_FORMAT,
    timeZone,
  });
}

/** "Expires <local time and zone> (<UTC time>)" for the form preview. */
export function formatDelegationExpiryPreview(
  locale: SupportedLocale,
  expiresAt: number,
  timeZone: string
): string {
  return t(locale, "delegation.expiry.preview", {
    local: formatDelegationExpiryLocal(locale, expiresAt, timeZone),
    utc: formatDate(locale, expiresAt * SECOND_MS, UTC_EXPIRY_FORMAT),
  });
}
