"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { usePageVisible } from "@/hooks/usePageVisibility";
import { formatInteger, selectPluralCategory } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  title?: string | undefined;
  date?: Date | undefined;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const UNIT_MESSAGE_KEYS = {
  days: { one: "dateCountdown.days.one", other: "dateCountdown.days.other" },
  hours: { one: "dateCountdown.hours.one", other: "dateCountdown.hours.other" },
  minutes: {
    one: "dateCountdown.minutes.one",
    other: "dateCountdown.minutes.other",
  },
  seconds: {
    one: "dateCountdown.seconds.one",
    other: "dateCountdown.seconds.other",
  },
} as const;

// Keyed by the larger units shown (days, hours, minutes); seconds always show.
const TIME_LEFT_MESSAGE_KEYS = {
  "": "dateCountdown.timeLeft.seconds",
  m: "dateCountdown.timeLeft.minutesSeconds",
  h: "dateCountdown.timeLeft.hoursSeconds",
  hm: "dateCountdown.timeLeft.hoursMinutesSeconds",
  d: "dateCountdown.timeLeft.daysSeconds",
  dm: "dateCountdown.timeLeft.daysMinutesSeconds",
  dh: "dateCountdown.timeLeft.daysHoursSeconds",
  dhm: "dateCountdown.timeLeft.daysHoursMinutesSeconds",
} as const;

function formatUnit(
  locale: SupportedLocale,
  unit: keyof typeof UNIT_MESSAGE_KEYS,
  value: number
): string {
  const keys = UNIT_MESSAGE_KEYS[unit];
  const key =
    selectPluralCategory(locale, value) === "one" ? keys.one : keys.other;
  return t(locale, key, { count: formatInteger(locale, value) });
}

function formatTimeLeft(locale: SupportedLocale, timeLeft: TimeLeft): string {
  const shape: keyof typeof TIME_LEFT_MESSAGE_KEYS = `${
    timeLeft.days > 0 ? "d" : ""
  }${timeLeft.hours > 0 ? "h" : ""}${timeLeft.minutes > 0 ? "m" : ""}`;
  return t(locale, TIME_LEFT_MESSAGE_KEYS[shape], {
    days: formatUnit(locale, "days", timeLeft.days),
    hours: formatUnit(locale, "hours", timeLeft.hours),
    minutes: formatUnit(locale, "minutes", timeLeft.minutes),
    seconds: formatUnit(locale, "seconds", timeLeft.seconds),
  });
}

const SKELETON_TEXT_CLASS =
  "tw-animate-[shimmer_1.5s_infinite] tw-rounded tw-bg-[linear-gradient(90deg,#444_25%,#555_50%,#444_75%)] tw-bg-[length:200%_100%]";

export default function DateCountdown(props: Readonly<Props>) {
  const { title, date } = props;
  const locale = useBrowserLocale();

  // Only consider the widget "ready" when BOTH title and date have arrived.
  const isReady = Boolean(title && date);

  // Calculate time left without re-creating the function each render.
  const calcTimeLeft = useMemo(() => {
    return (): TimeLeft | null => {
      if (!date) return null;

      const diff = date.getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

      let remaining = diff;

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      remaining -= days * (1000 * 60 * 60 * 24);

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      remaining -= hours * (1000 * 60 * 60);

      const minutes = Math.floor(remaining / (1000 * 60));
      remaining -= minutes * (1000 * 60);

      const seconds = Math.floor(remaining / 1000);

      return { days, hours, minutes, seconds };
    };
  }, [date]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPageVisible = usePageVisible();

  useEffect(() => {
    // Reset state whenever date changes (or becomes unavailable), and catch up
    // when a hidden page is shown again.
    setTimeLeft(calcTimeLeft());

    // If no date yet, or nobody can see the page, don't schedule ticks
    if (!date || !isPageVisible) return;

    const tick = () => {
      const next = calcTimeLeft();
      setTimeLeft(next);

      // Stop ticking at zero
      if (
        !next ||
        (next.days === 0 &&
          next.hours === 0 &&
          next.minutes === 0 &&
          next.seconds === 0)
      ) {
        timerRef.current && clearTimeout(timerRef.current);
        timerRef.current = null;
        return;
      }

      // Align to the next second boundary
      const now = Date.now();
      const msUntilNextSecond = 1000 - (now % 1000);
      timerRef.current = setTimeout(tick, msUntilNextSecond);
    };

    // Schedule first tick aligned to next second
    const now = Date.now();
    const msUntilNextSecond = 1000 - (now % 1000);
    timerRef.current = setTimeout(tick, msUntilNextSecond);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [date, calcTimeLeft, isPageVisible]);

  return (
    <div className="tw-flex tw-flex-col">
      {/* Title */}
      {isReady ? (
        <div>{title}</div>
      ) : (
        <div className={`${SKELETON_TEXT_CLASS} tw-w-1/2`} aria-hidden="true">
          &nbsp;
        </div>
      )}

      {/* Countdown */}
      <div className="tw-pt-2 tw-text-lg tw-font-bold" aria-live="polite">
        {isReady && timeLeft ? (
          formatTimeLeft(locale, timeLeft)
        ) : (
          <div className={`${SKELETON_TEXT_CLASS} tw-w-4/5`} aria-hidden="true">
            &nbsp;
          </div>
        )}
      </div>
    </div>
  );
}
