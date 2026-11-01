"use client";

import { useEffect, useState } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { factText, isFact, type FactEntry } from "@/lib/explained/facts";
import {
  formatUtcClock,
  formatUtcDay,
  minutesBetween,
} from "@/lib/explained/format";
import { ageText, isLate } from "../age";
import { kt } from "../i18n";
import Pulse from "../marks/Pulse";

/**
 * The feed-time pill (EXPLAINED.md §6.2): when the page's live source was
 * written or read, and how long ago. Live, the pulse shows; older than its
 * cadence plus two hours, the pulse stops and the pill says "late". A
 * record (a specification, a manifest, a validator's record) is not a live
 * feed: its pill names the record's date, with no pulse and no "late".
 */
export default function LivePill({
  fact,
  locale,
  kind = "feed",
  cadenceMinutes = 1440,
  lead: leadText,
  asOf,
  clock = "live",
}: {
  /** The time shown: when the feed or file was written, or when the page read it. */
  readonly fact: FactEntry | null;
  readonly locale: SupportedLocale;
  readonly kind?: "feed" | "file" | "read" | "record";
  readonly cadenceMinutes?: number;
  /** The pill's first words, naming what was written: "Manifest written". */
  readonly lead?: string;
  /** The page's render time: the age shown before the browser's clock takes over. */
  readonly asOf: string;
  /** "frozen" keeps the render time (the gallery, the gates' renders). */
  readonly clock?: "live" | "frozen";
}) {
  const [now, setNow] = useState(asOf);
  useEffect(() => {
    if (clock === "frozen") {
      return undefined;
    }
    const tick = () => setNow(new Date().toISOString());
    tick();
    const timer = globalThis.setInterval(tick, 60_000);
    return () => globalThis.clearInterval(timer);
  }, [clock]);

  if (!fact || !isFact(fact)) {
    return null;
  }
  const at = factText(fact);
  const minutes = minutesBetween(at, now);
  const record = kind === "record";
  const late = kind !== "read" && !record && isLate(minutes, cadenceMinutes);
  let lead = kt(locale, "explained.kit.live.read");
  if (kind === "feed") {
    lead = kt(locale, "explained.kit.live.feedWritten");
  } else if (kind === "file") {
    lead = kt(locale, "explained.kit.live.fileWritten");
  } else if (record) {
    lead = leadText ?? kt(locale, "explained.kit.live.recordWritten");
  }
  const clockText = record
    ? formatUtcDay(locale, at)
    : formatUtcClock(locale, at);
  const tail =
    kind === "read"
      ? formatUtcDay(locale, at)
      : kt(locale, "explained.kit.live.ago", { age: ageText(locale, minutes) });
  return (
    <span
      className="tw-inline-flex tw-h-[30px] tw-items-center tw-gap-2 tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-px-2.5 tw-text-xs tw-font-medium tw-text-iron-400 md:tw-h-8 md:tw-gap-[9px] md:tw-px-[13px] md:tw-text-[13px]"
      data-live={record ? "record" : late ? "late" : "live"}
      data-fact={fact.id}
      title={
        record
          ? kt(locale, "explained.kit.live.recordLabel", { time: clockText })
          : late
            ? kt(locale, "explained.kit.live.lateLabel", { time: clockText })
            : kt(locale, "explained.kit.live.liveLabel", { time: clockText })
      }
    >
      {!record && <Pulse live={!late} />}
      <span className={record ? "" : "tw-hidden lg:tw-inline"}>{lead}</span>
      <b className="tw-font-semibold tw-text-iron-300">{clockText}</b>
      {!record && (
        <span className="max-[359px]:tw-hidden">{`· ${late ? kt(locale, "explained.kit.live.late") : tail}`}</span>
      )}
    </span>
  );
}
