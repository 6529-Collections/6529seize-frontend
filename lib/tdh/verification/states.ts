import { cycleDayOfDate } from "@/lib/tdh/tdhV1Arithmetic";
import {
  DIFFERENCE_CLASSES,
  VERIFICATION_VERDICTS,
  type DifferenceClass,
  type KnownVerdict,
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

/** D132: the daily comparison starts on 16 October 2026. */
export const FIRST_REPORT_DATE = "2026-10-16";

export type VerdictState = KnownVerdict | "unknown";

export function verdictState(verdict: string): VerdictState {
  return (VERIFICATION_VERDICTS as readonly string[]).includes(verdict)
    ? (verdict as KnownVerdict)
    : "unknown";
}

export type PillTone = "success" | "primary" | "warning" | "error" | "neutral";

export const VERDICT_TONE: Record<VerdictState, PillTone> = {
  equal: "success",
  explained: "primary",
  investigating: "warning",
  mismatch: "error",
  pending: "neutral",
  unknown: "neutral",
};

export type CutoverState =
  | {
      readonly kind: "countdown";
      readonly days: number;
      readonly plannedDate: string;
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
  return {
    kind: "countdown",
    days: plannedDay - today,
    plannedDate: value.plannedDate,
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

/**
 * The "differenceSentence" key for the overview strip and cards: no
 * differences, all explained, or some under investigation.
 */
export function differenceSentenceKind(
  verdict: VerdictState,
  differenceCount: number
): "none" | "explained" | "investigating" | "mismatch" | "pending" | "unknown" {
  if (verdict === "pending") {
    return "pending";
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
