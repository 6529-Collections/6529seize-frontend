import Link from "next/link";
import { formatDate, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { VerificationIndexDay } from "@/lib/tdh/verification/schema";
import { cycleDayOfDate } from "@/lib/tdh/tdhV1Arithmetic";
import {
  indexDayVerdict,
  totalDelta,
  utcCycleDay,
  type PillTone,
  type VerdictState,
} from "@/lib/tdh/verification/states";
import TdhDisclosure from "../../shared/TdhDisclosure";
import TdhSubnavScroll from "../../shared/TdhSubnavScroll";
import { TDH_FOCUS_RING } from "../../shared/tdhStyles";
import { verificationDayHref } from "./VerificationHeadline";
import {
  formatCycleDate,
  formatInteger,
  formatShortCycleDate,
  formatSigned,
} from "./verificationFormat";

/** The newest days the strip shows; older ones stay in the table below. */
const CALENDAR_DAYS = 42;

const TONE_BG: Record<PillTone, string> = {
  success: "tw-bg-success/80 hover:tw-bg-success",
  primary: "tw-bg-primary-400/80 hover:tw-bg-primary-400",
  warning: "tw-bg-amber-400/80 hover:tw-bg-amber-400",
  error: "tw-bg-error/80 hover:tw-bg-error",
  neutral: "tw-bg-iron-500/80 hover:tw-bg-iron-400",
};

/**
 * Each verdict has its own look as well as its colour: a missing 6529.io
 * file is an amber outline, an unexplained difference a filled amber cell
 * with a mark, a mismatch a red cell with a cross.
 */
const VERDICT_CELL: Record<VerdictState, string> = {
  equal: TONE_BG.success,
  explained: TONE_BG.primary,
  investigating: TONE_BG.warning,
  mismatch: TONE_BG.error,
  liveUnavailable:
    "tw-border-2 tw-border-solid tw-border-amber-400 tw-bg-transparent hover:tw-bg-amber-400/20",
  pending: TONE_BG.neutral,
  unknown: TONE_BG.neutral,
};

const VERDICT_MARK: Partial<Record<VerdictState, string>> = {
  investigating: "!",
  mismatch: "×",
};

const CELL_SIZE = "tw-h-10 tw-w-full";

const LEGEND: readonly VerdictState[] = [
  "equal",
  "explained",
  "investigating",
  "mismatch",
  "liveUnavailable",
];

type Cell =
  | {
      readonly kind: "day";
      readonly day: VerificationIndexDay;
      readonly verdict: VerdictState;
    }
  | { readonly kind: "missing"; readonly cycleDay: number }
  | {
      readonly kind: "upcoming";
      readonly cycleDay: number;
      readonly cutover: boolean;
    };

function isoDate(cycleDay: number): string {
  return new Date(cycleDay * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Every cycle day from the first shown report to the latest, oldest first;
 * then, while the cutover is ahead, the days still to come up to it.
 */
function calendarCells(
  days: readonly VerificationIndexDay[],
  options: {
    readonly limit?: number;
    readonly upcomingUntil?: string | null;
    readonly today?: number;
  } = {}
): Cell[] {
  if (days.length === 0) {
    return [];
  }
  const limit = options.limit ?? CALENDAR_DAYS;
  const byDay = new Map(days.map((day) => [day.cycleDay, day]));
  const latest = Math.max(...byDay.keys());
  const first = Math.max(Math.min(...byDay.keys()), latest - limit + 1);
  const cells: Cell[] = [];
  for (let cycleDay = first; cycleDay <= latest; cycleDay += 1) {
    const day = byDay.get(cycleDay);
    cells.push(
      day
        ? { kind: "day", day, verdict: indexDayVerdict(day) }
        : { kind: "missing", cycleDay }
    );
  }
  const end = options.upcomingUntil
    ? cycleDayOfDate(options.upcomingUntil)
    : null;
  const today = options.today ?? latest;
  if (end !== null) {
    for (let cycleDay = latest + 1; cycleDay <= end; cycleDay += 1) {
      cells.push(
        cycleDay < today
          ? { kind: "missing", cycleDay }
          : { kind: "upcoming", cycleDay, cutover: cycleDay === end }
      );
    }
  }
  return cells;
}

function cellDate(cell: Cell): string {
  return cell.kind === "day" ? cell.day.date : isoDate(cell.cycleDay);
}

function formatDayOfMonth(locale: SupportedLocale, date: string): string {
  return formatDate(locale, date, { day: "numeric" });
}

/**
 * Total TDH, Rust − 6529.io, as a number under the day: 0 when equal, else
 * signed and compact (+1.2K), so the strip carries the delta itself.
 */
function DeltaLabel({
  locale,
  delta,
}: {
  readonly locale: SupportedLocale;
  readonly delta: number | null;
}) {
  if (delta === null) {
    return null;
  }
  return (
    <span
      className={`tw-text-xs tw-font-medium tw-tabular-nums tw-leading-4 ${delta === 0 ? "tw-text-iron-400" : "tw-text-amber-200"}`}
    >
      {formatNumber(locale, delta, {
        notation: "compact",
        maximumFractionDigits: 1,
        signDisplay: "exceptZero",
      })}
    </span>
  );
}

function CellSquare({
  locale,
  cell,
  delta,
  selected,
}: {
  readonly locale: SupportedLocale;
  readonly cell: Cell;
  readonly delta: number | null;
  readonly selected: boolean;
}) {
  const date = formatCycleDate(locale, cellDate(cell));
  if (cell.kind === "upcoming") {
    const label = t(
      locale,
      cell.cutover
        ? "network.tdh.verify.calendar.cutover"
        : "network.tdh.verify.calendar.upcoming",
      { date }
    );
    return (
      <span
        role="img"
        aria-label={label}
        title={label}
        className={`tw-flex ${CELL_SIZE} tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid ${
          cell.cutover
            ? "tw-border-primary-400/70 tw-bg-primary-500/15"
            : "tw-border-white/[0.08] tw-bg-iron-900"
        }`}
      >
        {cell.cutover && (
          <span
            aria-hidden="true"
            className="tw-size-1.5 tw-rounded-full tw-bg-primary-300"
          />
        )}
      </span>
    );
  }
  if (cell.kind === "missing") {
    const label = t(locale, "network.tdh.verify.calendar.missing", { date });
    return (
      <span
        role="img"
        aria-label={label}
        title={label}
        className={`tw-block ${CELL_SIZE} tw-rounded-md tw-border tw-border-dashed tw-border-iron-500`}
      />
    );
  }
  const label = t(locale, "network.tdh.verify.calendar.day", {
    date,
    cycle: formatInteger(locale, cell.day.cycleDay),
    verdict: t(locale, `network.tdh.shared.pill.${cell.verdict}` as MessageKey),
    delta: delta === null ? "–" : formatSigned(locale, delta),
  });
  return (
    <Link
      href={verificationDayHref(cell.day.cycleDay)}
      aria-label={label}
      title={label}
      aria-current={selected ? "date" : undefined}
      className={`tw-flex ${CELL_SIZE} tw-items-center tw-justify-center tw-rounded-md tw-text-sm tw-font-bold tw-text-iron-950 tw-no-underline tw-transition-colors motion-reduce:tw-transition-none ${VERDICT_CELL[cell.verdict]} ${
        selected
          ? "tw-ring-2 tw-ring-iron-50 tw-ring-offset-2 tw-ring-offset-iron-950"
          : ""
      } ${TDH_FOCUS_RING}`}
    >
      {VERDICT_MARK[cell.verdict] && (
        <span aria-hidden="true">{VERDICT_MARK[cell.verdict]}</span>
      )}
    </Link>
  );
}

/** The month (or months) the strip covers, as the day row's label. */
function monthLabel(locale: SupportedLocale, cells: readonly Cell[]): string {
  const months = [
    ...new Set(
      cells.map((cell) =>
        formatDate(locale, cellDate(cell), { month: "short", timeZone: "UTC" })
      )
    ),
  ];
  const first = months[0] ?? "";
  const last = months.at(-1) ?? "";
  return months.length > 1 ? `${first}–${last}` : first;
}

function LegendState({
  locale,
  state,
}: {
  readonly locale: SupportedLocale;
  readonly state: VerdictState;
}) {
  return (
    <li className="tw-inline-flex tw-items-center tw-gap-1.5">
      <span
        aria-hidden="true"
        className={`tw-flex tw-size-3.5 tw-items-center tw-justify-center tw-rounded-sm tw-text-xs tw-font-bold tw-leading-none tw-text-iron-950 ${VERDICT_CELL[state]}`}
      >
        {VERDICT_MARK[state]}
      </span>
      {t(locale, `network.tdh.shared.pill.${state}` as MessageKey)}
    </li>
  );
}

function MissingLegend({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <li className="tw-inline-flex tw-items-center tw-gap-1.5">
      <span
        aria-hidden="true"
        className="tw-size-2.5 tw-rounded-sm tw-border tw-border-dashed tw-border-iron-500"
      />
      {t(locale, "network.tdh.verify.history.noReport")}
    </li>
  );
}

function UpcomingLegend({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <>
      <li className="tw-inline-flex tw-items-center tw-gap-1.5">
        <span
          aria-hidden="true"
          className="tw-size-2.5 tw-rounded-sm tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-900"
        />
        {t(locale, "network.tdh.verify.calendar.upcomingLegend")}
      </li>
      <li className="tw-inline-flex tw-items-center tw-gap-1.5">
        <span
          aria-hidden="true"
          className="tw-size-2.5 tw-rounded-sm tw-border tw-border-solid tw-border-primary-400/70 tw-bg-primary-500/15"
        />
        {t(locale, "network.tdh.verify.calendar.cutoverLegend")}
      </li>
    </>
  );
}

/**
 * Every day at a glance: one square per day, coloured by its verdict and
 * linking to it, and under each the total's difference from 6529.io, as a
 * number. Days
 * without a report show as dashed squares, and while the cutover is ahead the
 * days still to come lead up to it. It grows to six weeks before it scrolls.
 */
export default function VerificationCalendar({
  locale,
  days,
  selectedCycleDay,
  upcomingUntil = null,
  now,
}: {
  readonly locale: SupportedLocale;
  readonly days: readonly VerificationIndexDay[];
  readonly selectedCycleDay: number;
  /** While the cutover is ahead: its planned date, to show the days to come. */
  readonly upcomingUntil?: string | null;
  readonly now: Date;
}) {
  const cells = calendarCells(days, {
    upcomingUntil,
    today: utcCycleDay(now),
  });
  if (cells.length === 0) {
    return null;
  }
  const deltas = cells.map((cell) =>
    cell.kind === "day"
      ? totalDelta(cell.day.totalTdh.rust, cell.day.totalTdh.live)
      : null
  );
  const first = cells[0];
  const last = cells.filter((cell) => cell.kind !== "upcoming").at(-1);
  const hasUpcoming = cells.some((cell) => cell.kind === "upcoming");
  const hasMissing = cells.some((cell) => cell.kind === "missing");
  // The legend names the states on screen; the others wait in "More".
  const inUse = new Set(
    cells.flatMap((cell) => (cell.kind === "day" ? [cell.verdict] : []))
  );
  const shownStates = LEGEND.filter((state) => inUse.has(state));
  const otherStates = LEGEND.filter((state) => !inUse.has(state));
  const dateOf = (cell: Cell | undefined) =>
    cell === undefined ? "" : formatShortCycleDate(locale, cellDate(cell));

  return (
    <section
      aria-labelledby="tdh-verify-calendar-heading"
      className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 tw-p-4 sm:tw-p-5"
    >
      <div className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-4 tw-gap-y-1">
        <h2
          id="tdh-verify-calendar-heading"
          className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100"
        >
          {t(locale, "network.tdh.verify.calendar.heading")}
        </h2>
        <p className="tw-m-0 tw-text-xs tw-text-iron-400">
          {t(locale, "network.tdh.verify.calendar.range", {
            from: dateOf(first),
            to: dateOf(last),
          })}
        </p>
      </div>
      {/* Row labels on the left, the days across the rest of the card:
          one column per day, as wide as the card allows, scrolling once
          the days need more room than it has. */}
      <div className="tw-mt-3 tw-flex tw-items-start tw-gap-2 sm:tw-gap-3">
        <div
          aria-hidden="true"
          className="tw-flex tw-shrink-0 tw-flex-col tw-pt-1 tw-text-right tw-text-xs tw-leading-4 tw-text-iron-400"
        >
          <span className="tw-h-10" />
          <span className="tw-mt-1 tw-flex tw-h-4 tw-items-center tw-justify-end tw-whitespace-nowrap">
            {t(locale, "network.tdh.verify.calendar.deltaRow")}
          </span>
          <span className="tw-mt-0.5 tw-whitespace-nowrap">
            {monthLabel(locale, cells)}
          </span>
        </div>
        <TdhSubnavScroll
          className="tw-min-w-0 tw-flex-1 tw-overflow-x-auto tw-px-1 tw-pb-1 tw-pt-1 tw-scrollbar-none"
          focusSelector='[aria-current="date"]'
        >
          <ol
            className="tw-m-0 tw-grid tw-list-none tw-gap-1 tw-p-0 sm:tw-gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${cells.length}, minmax(1.75rem, 1fr))`,
            }}
          >
            {cells.map((cell, index) => (
              <li
                key={`${cell.kind}-${cell.kind === "day" ? cell.day.cycleDay : cell.cycleDay}`}
                className="tw-flex tw-min-w-0 tw-flex-col tw-items-center"
              >
                <CellSquare
                  locale={locale}
                  cell={cell}
                  delta={deltas[index] ?? null}
                  selected={
                    cell.kind === "day" &&
                    cell.day.cycleDay === selectedCycleDay
                  }
                />
                <span
                  aria-hidden="true"
                  className="tw-mt-1 tw-flex tw-h-4 tw-w-full tw-items-center tw-justify-center"
                >
                  <DeltaLabel locale={locale} delta={deltas[index] ?? null} />
                </span>
                <span
                  aria-hidden="true"
                  className={`tw-mt-0.5 tw-text-xs tw-tabular-nums tw-leading-4 ${
                    cell.kind === "upcoming" && cell.cutover
                      ? "tw-font-semibold tw-text-primary-300"
                      : "tw-text-iron-400"
                  }`}
                >
                  {formatDayOfMonth(locale, cellDate(cell))}
                </span>
              </li>
            ))}
          </ol>
        </TdhSubnavScroll>
      </div>
      <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-2 tw-text-xs tw-text-iron-400">
        <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-x-3 tw-gap-y-1 tw-p-0">
          {shownStates.map((state) => (
            <LegendState key={state} locale={locale} state={state} />
          ))}
          {hasMissing && <MissingLegend locale={locale} />}
          {hasUpcoming && <UpcomingLegend locale={locale} />}
        </ul>
        {otherStates.length > 0 && (
          <TdhDisclosure
            summary={t(locale, "network.tdh.verify.calendar.moreStates")}
            summaryClassName="tw-min-h-8 tw-text-xs"
          >
            <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-x-3 tw-gap-y-1 tw-p-0 tw-pl-6">
              {otherStates.map((state) => (
                <LegendState key={state} locale={locale} state={state} />
              ))}
              {!hasMissing && <MissingLegend locale={locale} />}
            </ul>
          </TdhDisclosure>
        )}
        <p className="tw-m-0">
          {t(locale, "network.tdh.verify.calendar.bars")}
        </p>
      </div>
    </section>
  );
}
