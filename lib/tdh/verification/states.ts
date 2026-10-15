import { cycleDayOfDate } from "@/lib/tdh/tdhV1Arithmetic";
import {
  DIFFERENCE_CLASSES,
  type DifferenceClass,
  type VerificationCutover,
  type VerificationDifference,
  type VerificationIndex,
  type VerificationIndexDay,
} from "./schema";

/** D132: 6529.io switches to the Rust core's result about 23 October 2026. */
export const DEFAULT_CUTOVER: VerificationCutover = {
  plannedDate: "2026-10-23",
  status: "planned",
  cycleDay: null,
};

/** D132 was decided on 15 October 2026: the cutover week starts there. */
export const CUTOVER_DECIDED_DATE = "2026-10-15";

/** D132: the daily comparison starts on 16 October 2026. */
export const FIRST_REPORT_DATE = "2026-10-16";

/** Whether the first daily report should exist by now. */
export function reportsAreLate(now: Date): boolean {
  const first = cycleDayOfDate(FIRST_REPORT_DATE);
  return first !== null && utcCycleDay(now) > first;
}

/** How the page shows a day's verdict. */
export const VERDICT_STATES = [
  "equal",
  "explained",
  "investigating",
  "mismatch",
  "liveUnavailable",
  "pending",
  "unknown",
] as const;

export type VerdictState = (typeof VERDICT_STATES)[number];

/**
 * The daily job's verdict as a page state. `OK` is "equal" when no record
 * differs and "explained" when every difference has a known cause. The plain
 * names of the first data contract are still accepted.
 */
export function verdictState(
  verdict: string,
  hasDifferences: boolean
): VerdictState {
  switch (verdict) {
    case "OK":
      return hasDifferences ? "explained" : "equal";
    case "RUST_PYTHON_MISMATCH":
    case "mismatch":
      return "mismatch";
    case "LIVE_UNAVAILABLE":
      return "liveUnavailable";
    case "LIVE_UNEXPLAINED":
    case "investigating":
      return "investigating";
    case "equal":
    case "explained":
    case "pending":
      return verdict;
    default:
      return "unknown";
  }
}

/** Whether an index entry has any identity that differs from 6529.io. */
export function indexDayHasDifferences(day: VerificationIndexDay): boolean {
  return (
    day.identitiesEqual !== null &&
    day.identitiesTotal !== null &&
    day.identitiesEqual < day.identitiesTotal
  );
}

export function indexDayVerdict(day: VerificationIndexDay): VerdictState {
  return verdictState(day.verdict, indexDayHasDifferences(day));
}

export type PillTone = "success" | "primary" | "warning" | "error" | "neutral";

export const VERDICT_TONE: Record<VerdictState, PillTone> = {
  equal: "success",
  explained: "primary",
  investigating: "warning",
  mismatch: "error",
  liveUnavailable: "warning",
  pending: "neutral",
  unknown: "neutral",
};

export type CutoverState =
  | {
      readonly kind: "countdown";
      readonly days: number;
      readonly plannedDate: string;
      /** Share of the week from D132's decision to the planned day. */
      readonly elapsed: number;
    }
  | { readonly kind: "due"; readonly plannedDate: string }
  | {
      readonly kind: "done";
      readonly plannedDate: string;
      readonly cycleDay: number | null;
    };

/** Today's UTC cycle day: the number of whole days since 1970-01-01 UTC. */
export function utcCycleDay(now: Date): number {
  return Math.floor(now.getTime() / 86_400_000);
}

export function cutoverState(
  cutover: VerificationCutover | null | undefined,
  now: Date
): CutoverState {
  const value = cutover ?? DEFAULT_CUTOVER;
  if (value.status === "done") {
    return {
      kind: "done",
      plannedDate: value.plannedDate,
      cycleDay: value.cycleDay ?? null,
    };
  }
  const plannedDay = cycleDayOfDate(value.plannedDate);
  const today = utcCycleDay(now);
  if (plannedDay === null || today >= plannedDay) {
    return { kind: "due", plannedDate: value.plannedDate };
  }
  const decidedDay = cycleDayOfDate(CUTOVER_DECIDED_DATE) ?? today;
  const span = Math.max(plannedDay - decidedDay, 1);
  return {
    kind: "countdown",
    days: plannedDay - today,
    plannedDate: value.plannedDate,
    elapsed: Math.min(Math.max((today - decidedDay) / span, 0), 1),
  };
}

/** Days of the index, newest first. */
export function sortedIndexDays(
  index: VerificationIndex
): VerificationIndexDay[] {
  return [...index.days].sort((left, right) => right.cycleDay - left.cycleDay);
}

export function latestIndexDay(
  index: VerificationIndex
): VerificationIndexDay | null {
  return sortedIndexDays(index)[0] ?? null;
}

export interface DayNeighbours {
  readonly previous: number | null;
  readonly next: number | null;
  readonly latest: number | null;
}

export function dayNeighbours(
  index: VerificationIndex,
  cycleDay: number
): DayNeighbours {
  const days = sortedIndexDays(index).map((day) => day.cycleDay);
  const older = days.filter((day) => day < cycleDay);
  const newer = days.filter((day) => day > cycleDay);
  return {
    previous: older[0] ?? null,
    next: newer.at(-1) ?? null,
    latest: days[0] ?? null,
  };
}

/** Cycle days missing between the oldest and the newest report. */
export function missingCycleDays(
  index: VerificationIndex,
  limit = 60
): number[] {
  const present = new Set(index.days.map((day) => day.cycleDay));
  const days = [...present].sort((left, right) => left - right);
  const first = days[0];
  const last = days.at(-1);
  if (first === undefined || last === undefined) {
    return [];
  }
  const missing: number[] = [];
  for (let day = first + 1; day < last && missing.length < limit; day += 1) {
    if (!present.has(day)) {
      missing.push(day);
    }
  }
  return missing;
}

export type Freshness =
  | { readonly kind: "current"; readonly latest: number }
  | {
      readonly kind: "late";
      readonly latest: number;
      readonly missing: number;
    };

/**
 * Whether the latest report is current. Cycle N closes at 00:00 UTC of its
 * date and its report normally follows within a few hours, so a report more
 * than 30 hours past its own boundary means at least one day is missing.
 */
export function reportFreshness(latestCycleDay: number, now: Date): Freshness {
  const boundaryMs = latestCycleDay * 86_400_000;
  const hoursSince = (now.getTime() - boundaryMs) / 3_600_000;
  if (hoursSince <= 30) {
    return { kind: "current", latest: latestCycleDay };
  }
  return {
    kind: "late",
    latest: latestCycleDay,
    missing: Math.max(utcCycleDay(now) - latestCycleDay, 1),
  };
}

export type ClassCounts = Record<DifferenceClass, number>;

export function differenceClassCounts(
  differences: readonly VerificationDifference[]
): ClassCounts {
  const counts: ClassCounts = { A: 0, B: 0, C: 0, D: 0 };
  for (const difference of differences) {
    counts[difference.class] += 1;
  }
  return counts;
}

export { DIFFERENCE_CLASSES };

/** The share of equal records, or null when there are no records. */
export function agreementShare(equal: number, total: number): number | null {
  return total > 0 ? equal / total : null;
}

/** The holder a label belongs to: `holder-1/w2` belongs to `holder-1`. */
export function holderOf(label: string): string {
  return label.split("/")[0] ?? label;
}

export interface DifferenceCase {
  readonly holder: string;
  readonly identity: VerificationDifference | null;
  readonly wallets: readonly VerificationDifference[];
  readonly classes: readonly DifferenceClass[];
  readonly causes: readonly string[];
}

/**
 * Differences grouped by holder: an identity and its wallets are one case,
 * because a wallet's difference is usually its identity's difference.
 */
export function differenceCases(
  differences: readonly VerificationDifference[]
): DifferenceCase[] {
  const byHolder = new Map<string, VerificationDifference[]>();
  for (const difference of differences) {
    const holder = holderOf(difference.label);
    byHolder.set(holder, [...(byHolder.get(holder) ?? []), difference]);
  }
  return [...byHolder.entries()].map(([holder, records]) => {
    const identity =
      records.find((record) => record.kind === "identity") ?? null;
    const wallets = records.filter((record) => record !== identity);
    return {
      holder,
      identity,
      wallets,
      classes: [...new Set(records.map((record) => record.class))].sort(),
      causes: [
        ...new Set(
          records
            .map((record) => record.cause)
            .filter((cause): cause is string => cause !== null)
        ),
      ],
    };
  });
}

/**
 * The "differenceSentence" key for the overview strip and cards: no
 * differences, all explained, or some under investigation.
 */
export function differenceSentenceKind(
  verdict: VerdictState,
  differenceCount: number
):
  | "none"
  | "explained"
  | "investigating"
  | "mismatch"
  | "liveUnavailable"
  | "pending"
  | "unknown" {
  if (verdict === "pending" || verdict === "liveUnavailable") {
    return verdict;
  }
  if (verdict === "mismatch") {
    return "mismatch";
  }
  if (differenceCount === 0) {
    return "none";
  }
  if (verdict === "explained") {
    return "explained";
  }
  if (verdict === "investigating") {
    return "investigating";
  }
  return "unknown";
}

/** Rust minus 6529.io, or null when 6529.io has not published a value. */
export function totalDelta(
  rust: number,
  live: number | null | undefined
): number | null {
  return live === null || live === undefined ? null : rust - live;
}
