"use client";

import { useEffect, useState } from "react";
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

  const date = formatDate(locale, decisionTime);
  const time = formatTime(locale, decisionTime, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const label =
    date === formatDate(locale, now)
      ? t(locale, "home.comingUp.nextDecisionToday", { time })
      : t(locale, "home.comingUp.nextDecisionOn", { date, time });

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
