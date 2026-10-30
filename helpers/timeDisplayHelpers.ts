import { formatDate, formatRelativeTime } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";

const DAY_MS = 86_400_000;

interface TimeAgoShortOptions {
  /** Label language. Defaults to the app default locale. */
  readonly locale?: SupportedLocale | undefined;
  /**
   * IANA zone that decides where one calendar day ends and the next begins.
   * Defaults to the viewer's zone.
   */
  readonly timeZone?: string | undefined;
}

const zonedDayFormatters = new Map<string, Intl.DateTimeFormat>();

function getZonedDayFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = zonedDayFormatters.get(timeZone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  zonedDayFormatters.set(timeZone, formatter);
  return formatter;
}

function toDayIndex(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

// Index of the calendar day an instant falls on. Differences between indexes
// are calendar days, so a 23h or 25h DST day still counts as exactly one day.
export function getCalendarDayIndex(
  milliseconds: number,
  timeZone: string | undefined
): number {
  if (timeZone === undefined) {
    // The viewer's zone: local getters follow the live system zone, so there
    // is no cached formatter that could go stale if the zone changes.
    const date = new Date(milliseconds);
    return toDayIndex(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }
  let year = 0;
  let month = 0;
  let day = 0;
  for (const part of getZonedDayFormatter(timeZone).formatToParts(
    milliseconds
  )) {
    if (part.type === "year") year = Number(part.value);
    else if (part.type === "month") month = Number(part.value);
    else if (part.type === "day") day = Number(part.value);
  }
  return toDayIndex(year, month, day);
}

function capitalizeFirst(value: string, locale: SupportedLocale): string {
  return value.charAt(0).toLocaleUpperCase(locale) + value.slice(1);
}

export const getTimeAgo = (milliseconds: number): string => {
  const timeDifference = Date.now() - milliseconds;
  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
};

export const getTimeAgoShort = (
  milliseconds: number,
  referenceTime: number = Date.now(),
  alwaysRelative: boolean = false,
  { locale = DEFAULT_LOCALE, timeZone }: TimeAgoShortOptions = {}
): string => {
  const timeDifference = referenceTime - milliseconds;
  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (alwaysRelative) {
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return "<1m";
  }
  if (days > 0) {
    // "Yesterday" is the previous calendar day in the zone, not 24-48 hours of
    // elapsed time, which is wrong on DST days and late in the evening. When
    // 24h or more elapsed but the day did not change (the repeated hour of a
    // 25h day), the elapsed-hours label below is the honest one.
    const calendarDays =
      getCalendarDayIndex(referenceTime, timeZone) -
      getCalendarDayIndex(milliseconds, timeZone);
    if (calendarDays === 1) {
      return capitalizeFirst(formatRelativeTime(locale, -1, "day"), locale);
    }
    if (calendarDays > 1) {
      return formatDate(locale, milliseconds, {
        month: "short",
        day: "numeric",
        timeZone,
      });
    }
  }
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "Just now";
};

interface TimeUntilPart {
  readonly value: number;
  readonly unit: "year" | "month" | "day" | "hour" | "minute";
}

const formatTimeUntilPart = (
  { value, unit }: TimeUntilPart,
  isFuture: boolean
): string => {
  const prefix = isFuture ? "in" : "";
  const pluralSuffix = value > 1 ? "s" : "";
  const suffix = isFuture ? "" : "ago";
  return `${prefix} ${value} ${unit}${pluralSuffix} ${suffix}`;
};

export const getTimeUntil = (milliseconds: number): string => {
  let timeDifference = milliseconds - Date.now();
  const isFuture = timeDifference >= 0;
  timeDifference = Math.abs(timeDifference);
  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  const timeParts: readonly TimeUntilPart[] = [
    { value: years, unit: "year" },
    { value: months, unit: "month" },
    { value: days, unit: "day" },
    { value: hours, unit: "hour" },
    { value: minutes, unit: "minute" },
  ];
  const timePart = timeParts.find(({ value }) => value > 0);
  return timePart ? formatTimeUntilPart(timePart, isFuture) : "Just now";
};
