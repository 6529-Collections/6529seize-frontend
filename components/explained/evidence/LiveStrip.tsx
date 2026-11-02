import { rich } from "../rich";
import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { formatUtcDay } from "@/lib/explained/format";
import { kt } from "../i18n";
import Pulse from "../marks/Pulse";
import { dayKindOf, type ResultDay } from "./DayRibbon";

/**
 * Today on the network (EXPLAINED.md §6.4): under a hero, today's total and
 * identities with the verdict in words, and a mini ribbon of the results
 * with the open day. Each tile takes its day's verdict (green for equal or a
 * known cause, red for a day that differs), and the strip is green only
 * while the newest result is.
 */
const TILE = {
  equal: "tw-border-green/45 tw-bg-green/[0.08]",
  knownCause: "tw-border-green/45 tw-bg-green/[0.08]",
  differs: "tw-border-error/60 tw-bg-error/[0.09]",
} as const;
const WORD = {
  equal: "explained.kit.verdict.equal",
  knownCause: "explained.kit.verdict.knownCause",
  differs: "explained.kit.verdict.differs",
} as const;

type StripKind = keyof typeof TILE;

function stripKind(verdict: string): StripKind {
  const kind = dayKindOf(verdict);
  return kind === "equal" || kind === "knownCause" ? kind : "differs";
}
export default function LiveStrip({
  headline,
  children,
  days,
  openDate,
  locale,
}: {
  /** Today's total, as a fact. */
  readonly headline: ReactNode;
  /** The sentence under it: identities and the comparison. */
  readonly children: ReactNode;
  readonly days: readonly ResultDay[];
  readonly openDate?: string;
  readonly locale: SupportedLocale;
}) {
  const at = (date: string) => new Date(`${date}T00:00:00Z`);
  const dayNumber = (date: string) => String(at(date).getUTCDate());
  // Each tile says its month too, so "1" after "31" reads as a date.
  const month = (date: string) =>
    new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(
      at(date)
    );
  const face = (date: string) => (
    <span
      aria-hidden="true"
      className="tw-flex tw-w-full tw-flex-col tw-items-center"
    >
      {/* Under 360 px a tile is too narrow for its month: the legend and
          the list's names still date it. */}
      <span className="tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-400 max-[359px]:tw-hidden">
        {month(date)}
      </span>
      <span className="tw-text-[15px] tw-leading-5">{dayNumber(date)}</span>
    </span>
  );
  const newest = days.at(-1);
  const holds = newest === undefined || stripKind(newest.verdict) !== "differs";
  return (
    <section
      className={`tw-grid tw-grid-cols-1 tw-gap-3.5 tw-rounded-xl tw-border tw-border-solid tw-p-4 md:tw-gap-4 md:tw-px-[22px] md:tw-py-[18px] ${holds ? "tw-border-green/30 tw-bg-[linear-gradient(90deg,rgba(60,203,127,0.09),transparent_70%)]" : "tw-border-error/40 tw-bg-[linear-gradient(90deg,rgba(249,112,102,0.09),transparent_70%)]"}`}
      aria-label={kt(locale, "explained.kit.liveStrip.today")}
      data-livestrip=""
    >
      <div className="tw-text-base tw-leading-[25px] tw-text-iron-300">
        <span className="tw-mb-2 tw-flex tw-items-center tw-gap-2.5 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-primary-300">
          <Pulse />
          {kt(locale, "explained.kit.liveStrip.today")}
        </span>
        <b className="tw-block tw-text-[30px] tw-font-semibold tw-leading-9 tw-tracking-[-0.02em] tw-text-iron-50">
          {headline}
        </b>
        {children}
      </div>
      <ol
        className="tw-m-0 tw-grid tw-list-none tw-grid-cols-6 tw-gap-[5px] tw-p-0 md:tw-flex"
        aria-label={kt(locale, "explained.kit.day.ribbon")}
      >
        {days.map((day) => {
          const kind = stripKind(day.verdict);
          return (
            <li
              key={day.cycle}
              className={`tw-relative tw-grid tw-h-12 tw-place-items-center tw-rounded-md tw-border tw-border-solid tw-font-semibold tw-text-iron-50 md:tw-w-[50px] ${TILE[kind]}`}
              title={formatUtcDay(locale, day.date)}
              aria-label={kt(locale, "explained.kit.day.name", {
                date: formatUtcDay(locale, day.date),
                cycle: String(day.cycle),
                verdict: kt(locale, WORD[kind]),
              })}
              data-day-kind={kind}
            >
              {face(day.date)}
            </li>
          );
        })}
        {openDate && (
          <li
            className="tw-relative tw-grid tw-h-12 tw-place-items-center tw-rounded-md tw-border tw-border-dashed tw-border-primary-400/70 tw-bg-primary-400/[0.12] tw-font-semibold tw-text-primary-300 md:tw-w-[50px]"
            aria-label={kt(locale, "explained.kit.verdict.open")}
          >
            {face(openDate)}
          </li>
        )}
      </ol>
      {/* The dashed tile is dated by its snapshot, the midnight that ends
          today, so the legend says which day it counts. */}
      <p className="tw-m-0 -tw-mt-1.5 tw-text-[13px] tw-leading-5 tw-text-iron-400">
        {openDate
          ? rich(locale, "explained.kit.liveStrip.legendOpen", {
              date: (
                <span data-fact="tdh.open.date">
                  {formatUtcDay(locale, openDate)}
                </span>
              ),
            })
          : kt(locale, "explained.kit.liveStrip.legend")}
      </p>
    </section>
  );
}
