"use client";

import { getTimeAgoShort } from "@/helpers/timeDisplayHelpers";
import { useDisplayTimeZone } from "@/hooks/useDisplayTimeZone";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import {
  withDisplayTimeZone,
  withDisplayTimeZoneDate,
  type DisplayTimeZone,
} from "@/lib/display-time-zone/displayTimeZone";

type LocalDateTimeFormat = "date" | "dateTime" | "relative";

interface LocalDateTimeProps {
  /** An instant: epoch milliseconds, a Date, or an ISO 8601 date-time. */
  readonly value: Date | number | string;
  readonly format?: LocalDateTimeFormat | undefined;
  /** Pins the locale; defaults to the browser locale after hydration. */
  readonly locale?: SupportedLocale | undefined;
  readonly className?: string | undefined;
  readonly "data-testid"?: string | undefined;
}

const DATE_OPTIONS = {
  day: "numeric",
  month: "short",
  year: "numeric",
} satisfies Intl.DateTimeFormatOptions;

const DATE_TIME_OPTIONS = {
  ...DATE_OPTIONS,
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short",
} satisfies Intl.DateTimeFormatOptions;

const UTC_OPTIONS = {
  timeZone: "UTC",
  timeZoneName: "short",
} satisfies Intl.DateTimeFormatOptions;

const toInstant = (value: Date | number | string): Date | null => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getAbsoluteOptions = (
  format: LocalDateTimeFormat
): Intl.DateTimeFormatOptions =>
  format === "date" ? DATE_OPTIONS : DATE_TIME_OPTIONS;

const formatViewerLocal = (
  locale: SupportedLocale,
  date: Date,
  format: LocalDateTimeFormat,
  zone: DisplayTimeZone
): string => {
  if (format === "relative") {
    return getTimeAgoShort(date.getTime(), Date.now(), false, {
      timeZone: zone.timeZone,
    });
  }
  const options =
    format === "date"
      ? withDisplayTimeZoneDate(zone, DATE_OPTIONS)
      : withDisplayTimeZone(zone, DATE_TIME_OPTIONS);
  return formatDate(locale, date, options);
};

const formatUtcFallback = (
  locale: SupportedLocale,
  date: Date,
  format: LocalDateTimeFormat
): string =>
  formatDate(locale, date, { ...getAbsoluteOptions(format), ...UTC_OPTIONS });

/**
 * Shows an instant in the display time zone (the viewer's own zone unless
 * they chose UTC or another zone) without a hydration mismatch.
 * Server HTML and the hydration render show the same UTC-labelled fallback
 * (or, for relative time, a placeholder that names the UTC time to assistive
 * technology). The viewer-local text replaces it right after hydration, and
 * components mounted later render the local text immediately.
 */
export default function LocalDateTime({
  value,
  format = "date",
  locale,
  className,
  "data-testid": testId,
}: LocalDateTimeProps) {
  const hasHydrated = useHasHydrated();
  const browserLocale = useBrowserLocale();
  const zone = useDisplayTimeZone();
  const date = toInstant(value);
  if (date === null) {
    return null;
  }

  const resolvedLocale = locale ?? browserLocale;
  const dateTime = date.toISOString();

  if (hasHydrated) {
    return (
      <time data-testid={testId} dateTime={dateTime} className={className}>
        {formatViewerLocal(resolvedLocale, date, format, zone)}
      </time>
    );
  }

  const utcFallback = formatUtcFallback(resolvedLocale, date, format);
  if (format === "relative") {
    // Relative time depends on the render time, so the server never guesses it.
    return (
      <time data-testid={testId} dateTime={dateTime} className={className}>
        <span
          aria-hidden="true"
          className="tw-inline-block tw-h-3 tw-w-6 tw-rounded-sm tw-bg-iron-800 tw-align-middle"
        />
        <span className="tw-sr-only">{utcFallback}</span>
      </time>
    );
  }

  return (
    <time data-testid={testId} dateTime={dateTime} className={className}>
      {utcFallback}
    </time>
  );
}
