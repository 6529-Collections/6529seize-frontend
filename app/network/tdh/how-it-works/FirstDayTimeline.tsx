"use client";

import { useMeasuredWidth } from "@/components/explained/figures/useMeasuredWidth";
import type { SupportedLocale } from "@/i18n/locales";
import { utcClock, utcDay, utcWeekday } from "./_kit/time";
import { ht } from "./copy";
import type { FirstDayResult } from "./models/firstDay";

/**
 * The timeline of "A card ages" (TDH-DESIGN.md §5.3): the daily snapshots
 * as lines with their dates (the first that counts the copy in blue), the
 * arrival as a dot and the span it is held as a bar. HTML, not SVG
 * (EXPLAINED.md §7 rule 8): it is boxes and text, and it reflows. Built for
 * this page; a candidate for the kit's figures (a `Timeline`).
 */
const NARROW = 520;

export default function FirstDayTimeline({
  result,
  label,
  locale,
}: {
  readonly result: FirstDayResult;
  /** What the figure shows, for a screen reader. */
  readonly label: string;
  readonly locale: SupportedLocale;
}) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>(640);
  const narrow = width < NARROW;
  const span = result.end - result.start;
  const at = (seconds: number) =>
    Math.max(0, Math.min(100, ((seconds - result.start) / span) * 100));
  const heldEnd = result.sold ?? result.end;
  const arrivedAt = at(result.arrived);
  let arrivalAlign = "-tw-translate-x-1/2";
  if (arrivedAt < 20) arrivalAlign = "";
  else if (arrivedAt > 80) arrivalAlign = "-tw-translate-x-full";
  const when = `${utcDay(locale, result.arrived)}, ${utcClock(locale, result.arrived)} UTC`;

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      className="tw-relative tw-mx-1 tw-mt-11 tw-h-28"
      data-fig="timeline"
    >
      <div
        className="tw-absolute tw-inset-x-0 tw-top-[54px] tw-h-0.5 tw-bg-iron-700"
        aria-hidden="true"
      />
      <div
        className={`tw-absolute tw-top-[51px] tw-h-2 tw-rounded tw-bg-primary-400/[0.35] ${result.sold === null ? "" : "tw-border-0 tw-border-r-2 tw-border-solid tw-border-error"}`}
        style={{
          left: `${arrivedAt}%`,
          width: `${Math.max(0, at(heldEnd) - arrivedAt)}%`,
        }}
        aria-hidden="true"
        data-held=""
      />
      {result.snapshots.map((snap, index) => {
        const first = snap.T === result.first;
        const last = index === result.snapshots.length - 1;
        return (
          <div
            key={snap.T}
            className={`tw-absolute tw-top-[30px] tw-h-[50px] tw-w-0.5 ${first ? "tw-bg-primary-400" : "tw-bg-iron-300"}`}
            style={{ left: `calc(${at(snap.T)}% - 1px)` }}
            data-snap={first ? "first" : ""}
          >
            <span
              className={`tw-absolute -tw-top-6 tw-whitespace-nowrap tw-text-[13px] tw-font-semibold tw-leading-[18px] ${first ? "tw-text-primary-300" : "tw-text-iron-300"} ${last ? "tw-right-0" : "tw-left-1/2 -tw-translate-x-1/2"}`}
            >
              {narrow ? utcDay(locale, snap.T) : utcWeekday(locale, snap.T)}
            </span>
          </div>
        );
      })}
      <div
        className="tw-absolute tw-top-[46px] -tw-ml-[9px] tw-size-[18px] tw-rounded-full tw-bg-primary-400 tw-shadow-[0_0_0_5px_rgba(82,139,255,0.25)]"
        style={{ left: `${arrivedAt}%` }}
        aria-hidden="true"
      />
      <span
        className={`tw-absolute tw-top-[84px] tw-whitespace-nowrap tw-text-[13px] tw-leading-[18px] tw-text-iron-400 ${arrivalAlign}`}
        style={{ left: `${arrivedAt}%` }}
      >
        {ht(locale, "explained.tdh.how.firstday.arrivesAt", { when })}
      </span>
    </div>
  );
}
