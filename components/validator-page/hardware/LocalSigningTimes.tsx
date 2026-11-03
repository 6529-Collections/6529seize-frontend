"use client";

import { useSyncExternalStore } from "react";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatTime } from "@/i18n/format";

const TIME = { hour: "numeric", minute: "2-digit" } as const;

function todayAtUtc(hours: number, minutes: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hours,
      minutes
    )
  );
}

// The times don't change while the page is open, so there is nothing to
// subscribe to. The server has no snapshot: it doesn't know the zone.
const subscribe = () => () => undefined;
const noTimes = () => null;

/**
 * The day's two UTC times in the reader's own time zone. The server doesn't
 * know that zone, so this renders nothing until the browser has hydrated it.
 */
export default function LocalSigningTimes() {
  const locale = useBrowserLocale();
  // A string, so the snapshot stays the same value between renders.
  const times = useSyncExternalStore(
    subscribe,
    () =>
      `${formatTime(locale, todayAtUtc(0, 15), TIME)}|${formatTime(locale, todayAtUtc(19, 0), TIME)}`,
    noTimes
  );

  if (times === null) {
    return null;
  }
  const [signs, closes] = times.split("|");
  return (
    <p className="tw-mb-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-300">
      Where you are, 00:15 UTC is{" "}
      <span className="tw-font-semibold tw-text-iron-50">{signs}</span> and
      19:00 UTC is{" "}
      <span className="tw-font-semibold tw-text-iron-50">{closes}</span>.
    </p>
  );
}
