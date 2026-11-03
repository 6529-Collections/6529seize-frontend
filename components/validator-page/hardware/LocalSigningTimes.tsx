"use client";

import { useEffect, useState } from "react";

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

/**
 * The day's two UTC times in the reader's own time zone. The server doesn't
 * know that zone, so this renders nothing until the browser has mounted it.
 */
export default function LocalSigningTimes() {
  const locale = useBrowserLocale();
  const [times, setTimes] = useState<{
    readonly signs: string;
    readonly closes: string;
  } | null>(null);

  useEffect(() => {
    setTimes({
      signs: formatTime(locale, todayAtUtc(0, 15), TIME),
      closes: formatTime(locale, todayAtUtc(19, 0), TIME),
    });
  }, [locale]);

  if (times === null) {
    return null;
  }
  return (
    <p className="tw-mb-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-300">
      Where you are, 00:15 UTC is{" "}
      <span className="tw-font-semibold tw-text-iron-50">{times.signs}</span>{" "}
      and 19:00 UTC is{" "}
      <span className="tw-font-semibold tw-text-iron-50">{times.closes}</span>.
    </p>
  );
}
