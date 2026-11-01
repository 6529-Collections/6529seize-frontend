"use client";

import Tag from "@/components/explained/marks/Tag";
import { ageText } from "@/components/explained/age";
import { useFactSnapshot } from "@/components/explained/facts/FactsProvider";
import type { SupportedLocale } from "@/i18n/locales";
import { factFromSnapshot } from "@/lib/explained/facts";
import {
  formatCents,
  formatUtcClock,
  formatUtcDay,
  formatUtcWeekday,
} from "@/lib/explained/format";
import { ot } from "./copy";
import { firstCount, shareOfWindow } from "./explain";

/**
 * "Bought this week" (TDH-DESIGN.md §4.1 §03): a copy of the newest card
 * that arrived the evening before the latest result. Your card counts from
 * the result after next, and the timeline shows why: the first snapshot
 * finds less than a whole day. The arrival is a constructed example
 * (`example.firstCard.arrivedAt`); the dates and the gap are computed from
 * it by P26 §4's rule, and the rate is the card's real one.
 */
const EXAMPLE_CARD = 562;
/** The timeline spans four days from the day before the arrival. */
const WINDOW_DAYS = 4;

function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

export default function NewBuyerExample({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const snapshot = useFactSnapshot();
  const arrived = factFromSnapshot<string>(
    snapshot,
    "example.firstCard.arrivedAt"
  )?.value;
  const rate = factFromSnapshot<number>(
    snapshot,
    `meme.${EXAMPLE_CARD}.rate`
  )?.value;
  const publish = factFromSnapshot<string>(snapshot, "tdh.nextResultAt")?.value;
  if (arrived === undefined || rate === undefined || publish === undefined) {
    return null;
  }
  const count = firstCount(arrived);
  const start = addDays(count.gapDate, -2);
  const snaps = [1, 2, 3].map((offset) => addDays(start, offset));
  const at = (iso: string) =>
    `${(shareOfWindow(iso, start, WINDOW_DAYS) * 100).toFixed(2)}%`;
  const arrivalShare = at(arrived);
  const rateText = formatCents(locale, rate);
  return (
    <div data-ans="new" data-ex-allow-number="">
      {/* The result speaks to "you" with real dates, so it carries its own
          Example tag: no one should read it as their own wallet. */}
      <Tag kind="example" locale={locale} />
      <p className="tw-m-0 tw-mt-2 tw-text-[21px] tw-font-semibold tw-leading-7 tw-text-iron-50">
        {ot(locale, "explain.newTitle", {
          date: formatUtcWeekday(locale, count.firstDate),
        })}
      </p>
      <p className="tw-m-0 tw-mt-2 tw-text-[15px] tw-leading-6 tw-text-iron-300">
        {ot(locale, "explain.newBody", {
          card: EXAMPLE_CARD,
          arrived: `${formatUtcDay(locale, arrived)}, ${formatUtcClock(locale, arrived)}`,
          gapDate: formatUtcDay(locale, count.gapDate),
          gap: ageText(locale, count.gapMinutes),
          firstDate: formatUtcWeekday(locale, count.firstDate),
          publish: formatUtcClock(locale, publish),
          rate: rateText,
        })}
      </p>
      <div
        className="tw-relative tw-mt-7 tw-h-28"
        role="img"
        aria-label={ot(locale, "explain.timelineAria")}
      >
        <div className="tw-absolute tw-inset-x-0 tw-top-[54px] tw-h-0.5 tw-bg-iron-700" />
        <div
          className="tw-absolute tw-right-0 tw-top-[51px] tw-h-2 tw-rounded tw-bg-primary-400/35"
          style={{ left: arrivalShare }}
        />
        {snaps.map((date) => {
          const first = date === count.firstDate;
          return (
            <div
              key={date}
              className={`tw-absolute tw-top-[30px] tw-h-[50px] tw-w-0.5 ${first ? "tw-bg-primary-400" : "tw-bg-iron-300"}`}
              style={{ left: at(`${date}T00:00:00Z`) }}
            >
              <span
                className={`tw-absolute -tw-top-6 tw-left-1/2 -tw-translate-x-1/2 tw-whitespace-nowrap tw-text-[13px] tw-font-semibold ${first ? "tw-text-primary-300" : "tw-text-iron-300"}`}
              >
                {first
                  ? formatUtcWeekday(locale, date)
                  : formatUtcDay(locale, date)}
              </span>
            </div>
          );
        })}
        <div
          className="tw-absolute tw-top-[46px] -tw-ml-[9px] tw-size-[18px] tw-rounded-full tw-bg-primary-400 tw-shadow-[0_0_0_5px_rgba(82,139,255,0.25)]"
          style={{ left: arrivalShare }}
        />
        <span
          className="tw-absolute tw-top-[84px] -tw-translate-x-1/2 tw-whitespace-nowrap tw-text-[13px] tw-leading-[18px] tw-text-iron-400"
          style={{ left: arrivalShare }}
        >
          {ot(locale, "explain.arrives", {
            time: `${formatUtcDay(locale, arrived)}, ${formatUtcClock(locale, arrived)}`,
          })}
        </span>
      </div>
      <p className="tw-m-0 tw-mt-2 tw-text-[15px] tw-leading-[23px] tw-text-iron-400">
        {ot(locale, "explain.timeline")}
      </p>
    </div>
  );
}
