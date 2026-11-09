import { getCalendarDayIndex } from "@/helpers/timeDisplayHelpers";
import { formatRelativeTime } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import {
  withDisplayTimeZone,
  withDisplayTimeZoneDate,
  type DisplayTimeZone,
} from "@/lib/display-time-zone/displayTimeZone";

export interface ZonedTimestampOptions {
  readonly zone: DisplayTimeZone;
  /** App locale, for words such as "Yesterday". */
  readonly locale: SupportedLocale;
  /**
   * Locale for clock and date formats. `undefined` keeps the browser's own
   * format (12- or 24-hour, day order), as post headers always have.
   */
  readonly formatLocale?: Intl.LocalesArgument | undefined;
  /** Reference time; defaults to now. */
  readonly now?: number | undefined;
}

const CLOCK_TIME: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
};

function format(
  formatLocale: Intl.LocalesArgument,
  value: Date,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(formatLocale, options).format(value);
}

function getZonedYear(value: Date, timeZone: string | undefined): number {
  const year = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" })
    .formatToParts(value)
    .find((part) => part.type === "year")?.value;
  return Number(year);
}

/** Calendar days between `value` and `now` in the display zone (0 = same day). */
export function getZonedDaysAgo(
  value: Date,
  zone: DisplayTimeZone,
  now: number = Date.now()
): number {
  return (
    getCalendarDayIndex(now, zone.timeZone) -
    getCalendarDayIndex(value.getTime(), zone.timeZone)
  );
}

export function getYesterdayLabel(locale: SupportedLocale): string {
  const word = formatRelativeTime(locale, -1, "day");
  return word.charAt(0).toLocaleUpperCase(locale) + word.slice(1);
}

/** "05:06 PM", or "05:06 PM UTC" outside the device zone. */
export function formatZonedClockTime(
  value: Date,
  { zone, formatLocale }: Pick<ZonedTimestampOptions, "zone" | "formatLocale">
): string {
  return format(formatLocale, value, withDisplayTimeZone(zone, CLOCK_TIME));
}

function formatShortDate(
  value: Date,
  { zone, formatLocale, now = Date.now() }: ZonedTimestampOptions,
  day: "numeric" | "2-digit"
): string {
  const sameYear =
    getZonedYear(value, zone.timeZone) ===
    getZonedYear(new Date(now), zone.timeZone);
  return format(
    formatLocale,
    value,
    withDisplayTimeZoneDate(zone, {
      month: "short",
      day,
      ...(sameYear ? {} : { year: "numeric" }),
    })
  );
}

/**
 * The post-header timestamp: the clock time today, then "Yesterday - 05:06 PM"
 * and "Nov 07 - 05:06 PM" on wide screens, or only the day on narrow ones.
 * Days and "Yesterday" follow the display zone.
 */
export function formatWaveDropTimestamp(
  value: Date,
  options: ZonedTimestampOptions & { readonly dateOnlyAfterToday?: boolean }
): string {
  const daysAgo = getZonedDaysAgo(value, options.zone, options.now);
  if (daysAgo === 0) {
    return formatZonedClockTime(value, options);
  }
  if (options.dateOnlyAfterToday) {
    return daysAgo === 1
      ? getYesterdayLabel(options.locale)
      : formatShortDate(value, options, "2-digit");
  }
  const time = formatZonedClockTime(value, options);
  if (daysAgo === 1) {
    return `${getYesterdayLabel(options.locale)} - ${time}`;
  }
  return `${formatShortDate(value, options, "2-digit")} - ${time}`;
}

/** The timestamp revealed on grouped chat rows (hover or swipe). */
export function formatWaveDropRevealTimestamp(
  value: Date,
  options: ZonedTimestampOptions
): string {
  const { zone, formatLocale, now = Date.now() } = options;
  const daysAgo = getZonedDaysAgo(value, zone, now);
  if (daysAgo === 0) {
    return formatZonedClockTime(value, options);
  }
  if (daysAgo === 1) {
    return `${getYesterdayLabel(options.locale)}, ${formatZonedClockTime(value, options)}`;
  }
  const sameYear =
    getZonedYear(value, zone.timeZone) ===
    getZonedYear(new Date(now), zone.timeZone);
  return format(
    formatLocale,
    value,
    withDisplayTimeZone(zone, {
      month: "short",
      day: "numeric",
      ...(sameYear ? {} : { year: "2-digit" }),
      hour: "numeric",
      minute: "2-digit",
    })
  );
}
