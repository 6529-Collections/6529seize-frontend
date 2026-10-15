"use client";

import {
  formatLocalScheduleTimes,
  formatUtcTimeOfDay,
  type UtcTimeOfDay,
} from "@/helpers/utc-schedule.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useSyncExternalStore } from "react";

const MS_PER_MINUTE = 60_000;

// The clock is an external store with no server value: the server and the
// hydration render read null, then the client reads the current minute.
const subscribeToClock = () => () => undefined;
const getMinuteClockSnapshot = (): number | null =>
  Math.floor(Date.now() / MS_PER_MINUTE);
const getServerMinuteClockSnapshot = (): number | null => null;

interface UtcScheduleTimeProps {
  readonly time: UtcTimeOfDay;
  /** UTC weekdays the schedule recurs on (0 = Sunday). */
  readonly weekdays: readonly number[];
  /** Pins the locale; defaults to the browser locale after hydration. */
  readonly locale?: SupportedLocale | undefined;
}

/**
 * A weekly time published in UTC, such as "16:00 UTC", followed by its
 * equivalent in the viewer's time zone, such as "(your time: Mon, Wed, Fri
 * 09:00 PDT)". The local part depends on the viewer's zone and the current
 * date (daylight saving), so server HTML and the hydration render show the UTC
 * time only. The local part is added right after hydration, and components
 * mounted later render it immediately.
 */
export default function UtcScheduleTime({
  time,
  weekdays,
  locale,
}: UtcScheduleTimeProps) {
  const minuteClock = useSyncExternalStore(
    subscribeToClock,
    getMinuteClockSnapshot,
    getServerMinuteClockSnapshot
  );
  const browserLocale = useBrowserLocale();
  const resolvedLocale = locale ?? browserLocale;
  const utcTime = formatUtcTimeOfDay(resolvedLocale, time);
  const localTimes =
    minuteClock === null
      ? null
      : formatLocalScheduleTimes(
          resolvedLocale,
          time,
          weekdays,
          minuteClock * MS_PER_MINUTE
        );

  if (localTimes === null) {
    return <>{utcTime}</>;
  }

  return (
    <>
      {utcTime}{" "}
      <span className="tw-font-normal tw-text-iron-400">
        {t(resolvedLocale, "utcSchedule.localEquivalent", {
          when: localTimes,
        })}
      </span>
    </>
  );
}
