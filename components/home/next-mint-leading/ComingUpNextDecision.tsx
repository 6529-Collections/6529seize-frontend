"use client";

import { useEffect, useState } from "react";
import { getCalendarDayIndex } from "@/helpers/timeDisplayHelpers";
import { usePageVisible } from "@/hooks/usePageVisibility";
import { formatDate, formatTime } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

interface ComingUpNextDecisionProps {
  readonly timestamp: number | null;
  readonly locale: SupportedLocale;
}

export function ComingUpNextDecision({
  timestamp,
  locale,
}: ComingUpNextDecisionProps) {
  // Leave local dates out of server HTML and the matching hydration render.
  const [now, setNow] = useState<number | null>(null);
  const visible = usePageVisible();
  const decisionTime = new Date(timestamp ?? Number.NaN).getTime();

  useEffect(() => {
    if (!Number.isFinite(decisionTime) || !visible) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      clearTimeout(timeout);
      const current = Date.now();
      setNow(current);
      if (decisionTime <= current) return;

      // Only midnight or the decision itself can change this label. Local
      // midnight uses calendar arithmetic so 23/25-hour DST days work too.
      const midnight = new Date(current);
      midnight.setHours(24, 0, 0, 0);
      timeout = setTimeout(
        update,
        Math.min(midnight.getTime(), decisionTime) - current
      );
    };

    update();
    globalThis.addEventListener("focus", update);
    return () => {
      clearTimeout(timeout);
      globalThis.removeEventListener("focus", update);
    };
  }, [decisionTime, visible]);

  if (now === null || !Number.isFinite(decisionTime) || decisionTime <= now) {
    return null;
  }

  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  const daysUntil =
    getCalendarDayIndex(decisionTime, timeZone) -
    getCalendarDayIndex(now, timeZone);
  const time = formatTime(locale, decisionTime, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  let label: string;
  if (daysUntil === 0) {
    label = t(locale, "home.comingUp.nextDecisionToday", { time });
  } else if (daysUntil === 1) {
    label = t(locale, "home.comingUp.nextDecisionTomorrow", { time });
  } else {
    const date = formatDate(
      locale,
      decisionTime,
      daysUntil < 7 ? { weekday: "long" } : { month: "short", day: "numeric" }
    );
    label = t(locale, "home.comingUp.nextDecisionOn", { date, time });
  }

  return (
    <>
      {" "}
      <time
        dateTime={new Date(decisionTime).toISOString()}
        title={formatDate(locale, decisionTime, {
          dateStyle: "full",
          timeStyle: "long",
        })}
      >
        {label}
      </time>
    </>
  );
}
