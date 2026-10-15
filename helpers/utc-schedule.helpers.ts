import { formatDate, formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";

import {
  getNextUtcOccurrence,
  type UtcTimeOfDay,
} from "./utc-next-occurrence.helpers";

export type { UtcTimeOfDay } from "./utc-next-occurrence.helpers";

// 24-hour time with the zone name ("16:00 UTC", "09:00 PDT") so the UTC time
// and the viewer-local equivalent read the same way. `hourCycle` rather than
// `hour12: false`, which prints midnight as "24:00" in some locales.
const CLOCK_OPTIONS = {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZoneName: "short",
} satisfies Intl.DateTimeFormatOptions;

const WEEKDAY_OPTIONS = {
  weekday: "short",
} satisfies Intl.DateTimeFormatOptions;

/** Formats a UTC time of day, for example "16:00 UTC". Zone independent. */
export function formatUtcTimeOfDay(
  locale: SupportedLocale,
  time: UtcTimeOfDay
): string {
  return formatDate(locale, Date.UTC(1970, 0, 1, time.hour, time.minute), {
    ...CLOCK_OPTIONS,
    timeZone: "UTC",
  });
}

interface ScheduleOccurrence {
  readonly day: string;
  readonly time: string;
}

function getScheduleOccurrences(
  locale: SupportedLocale,
  time: UtcTimeOfDay,
  utcWeekdays: readonly number[],
  nowMs: number,
  zone: Intl.DateTimeFormatOptions
): ScheduleOccurrence[] {
  return utcWeekdays.flatMap((weekday) => {
    const instant = getNextUtcOccurrence(time, weekday, nowMs);
    return instant === null
      ? []
      : [
          {
            day: formatDate(locale, instant, { ...WEEKDAY_OPTIONS, ...zone }),
            time: formatDate(locale, instant, { ...CLOCK_OPTIONS, ...zone }),
          },
        ];
  });
}

const describeOccurrences = (occurrences: readonly ScheduleOccurrence[]) =>
  occurrences.map((occurrence) => `${occurrence.day} ${occurrence.time}`);

/**
 * The upcoming occurrences of a weekly UTC schedule, written in the viewer's
 * time zone: "Mon, Wed, Fri 09:00 PDT" for a viewer in Los Angeles in summer,
 * "Tue, Thu, Sat 05:00 GMT+13" in Auckland. The weekday is part of the answer
 * because the local day can differ from the UTC day. Each weekday is resolved
 * to its next occurrence, so a daylight-saving change before one of them is
 * reflected. Without a shared local time, each day is listed with its own.
 *
 * Returns null when there is nothing to add: no weekday resolves, or the
 * viewer's schedule reads exactly like the UTC one (a viewer in UTC).
 *
 * Reads the runtime's time zone: call it only on the client, after
 * hydration.
 */
export function formatLocalScheduleTimes(
  locale: SupportedLocale,
  time: UtcTimeOfDay,
  utcWeekdays: readonly number[],
  nowMs: number
): string | null {
  const occurrences = getScheduleOccurrences(
    locale,
    time,
    utcWeekdays,
    nowMs,
    {}
  );
  const [first] = occurrences;
  if (first === undefined) {
    return null;
  }

  const utcOccurrences = getScheduleOccurrences(
    locale,
    time,
    utcWeekdays,
    nowMs,
    { timeZone: "UTC" }
  );
  const described = describeOccurrences(occurrences);
  if (described.join("|") === describeOccurrences(utcOccurrences).join("|")) {
    return null;
  }

  const listOptions = { style: "short", type: "unit" } as const;
  if (occurrences.every((occurrence) => occurrence.time === first.time)) {
    const days = formatList(
      locale,
      occurrences.map((occurrence) => occurrence.day),
      listOptions
    );
    return `${days} ${first.time}`;
  }
  return formatList(locale, described, listOptions);
}
