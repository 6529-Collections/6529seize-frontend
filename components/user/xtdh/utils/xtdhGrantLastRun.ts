import { formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

const LAST_RUN_FORMAT = {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZoneName: "short",
} satisfies Intl.DateTimeFormatOptions;

/**
 * The last daily xTDH run that can add xTDH for a grant ending at
 * `validUntil` (the grant's `valid_to`, in epoch milliseconds as the API
 * returns it), or null when the value is not a valid instant.
 *
 * xTDH accrues in whole UTC days. Each daily run takes the latest 00:00 UTC as
 * its cutoff and credits the full UTC days between the grant's start and the
 * earlier of that cutoff and `valid_to`. A grant's total therefore last grows
 * in the run whose cutoff is 00:00 UTC on the UTC date of `valid_to` (the
 * latest 00:00 UTC at or before it, even when `valid_to` is exactly 00:00);
 * later runs add nothing. The grant's start and token ownership can mean that
 * run credits nothing, which this value cannot know.
 */
function getLastXtdhGrantRun(validUntil: number | string): Date | null {
  const validUntilMillis = new Date(validUntil).getTime();
  if (!Number.isFinite(validUntilMillis)) {
    return null;
  }
  return new Date(
    Math.floor(validUntilMillis / MILLIS_PER_DAY) * MILLIS_PER_DAY
  );
}

interface LastXtdhGrantRun {
  /** The run's cutoff instant as an ISO 8601 string, for `<time dateTime>`. */
  readonly iso: string;
  /**
   * The cutoff as a UTC date and time with its zone label, such as
   * "Dec 5, 2025, 00:00 UTC" in en-US. The same in every time zone.
   */
  readonly label: string;
}

/**
 * The last xTDH run for a grant ending at `validUntil` (see
 * `getLastXtdhGrantRun`), ready to display, or null when there is none.
 */
export function describeLastXtdhGrantRun(
  locale: SupportedLocale,
  validUntil: number | string
): LastXtdhGrantRun | null {
  const lastRun = getLastXtdhGrantRun(validUntil);
  return lastRun === null
    ? null
    : {
        iso: lastRun.toISOString(),
        label: formatUtcDate(locale, lastRun, LAST_RUN_FORMAT),
      };
}
