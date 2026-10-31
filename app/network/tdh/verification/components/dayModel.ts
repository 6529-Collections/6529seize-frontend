import type { DayKind } from "@/components/explained/evidence/DayRibbon";
import type { VerdictState } from "@/components/explained/evidence/Verdict";
import {
  factText,
  type Fact,
  type FactBook,
  type FactId,
} from "@/lib/explained/facts";
import type { DayField } from "@/lib/explained/registry/dayFacts";

/**
 * One published day as the daily check and its receipt read it: every
 * value through the facts layer, by the latest day's facts on the daily
 * check (`tdh.latest.total`) and by the day's own on a receipt
 * (`tdh.day.20742.total`), so a page never holds a number of its own.
 */
export interface DayView {
  readonly id: (field: DayField) => FactId;
  readonly fact: (field: DayField) => Fact | null;
  readonly num: (field: DayField) => number | null;
  readonly text: (field: DayField) => string | null;
}

export function dayView(book: FactBook, day: "latest" | number): DayView {
  const id = (field: DayField): FactId =>
    day === "latest" ? `tdh.latest.${field}` : `tdh.day.${day}.${field}`;
  const fact = (field: DayField) => book.maybe(id(field));
  return {
    id,
    fact,
    num: (field) => {
      const found = fact(field);
      return found && typeof found.value === "number" ? found.value : null;
    },
    text: (field) => {
      const found = fact(field);
      return found ? factText(found) : null;
    },
  };
}

/**
 * What a day's file says, as the page tells it:
 * - `equal`: every identity and wallet the same in all three;
 * - `knownCause`: some differ from 6529.io, each by a known class A or B
 *   difference (the feed's OK with differences; formerly "Explained");
 * - `liveDiffers`: 6529.io differs with no known cause (LIVE_UNEXPLAINED);
 * - `programsDiffer`: the two programs disagree (RUST_PYTHON_MISMATCH);
 * - `notCompared`: 6529.io's upload was not compared (LIVE_UNAVAILABLE,
 *   OK_NO_LIVE);
 * - `unknown`: a verdict this page does not know.
 */
export type CheckState =
  | "equal"
  | "knownCause"
  | "liveDiffers"
  | "programsDiffer"
  | "notCompared"
  | "unknown";

/** Counts that tell an equal day from one with differences. */
interface DayCounts {
  readonly identitiesEqual: number | null;
  readonly identitiesTotal: number | null;
  readonly walletsEqual?: number | null;
  readonly walletsTotal?: number | null;
  readonly differingRecords?: number | null;
}

export function checkStateOf(verdict: string, counts: DayCounts): CheckState {
  switch (verdict) {
    case "OK": {
      const short = (equal?: number | null, total?: number | null) =>
        equal !== null &&
        equal !== undefined &&
        total !== null &&
        total !== undefined &&
        equal < total;
      const differs =
        short(counts.identitiesEqual, counts.identitiesTotal) ||
        short(counts.walletsEqual, counts.walletsTotal) ||
        (counts.differingRecords ?? 0) > 0;
      return differs ? "knownCause" : "equal";
    }
    case "LIVE_UNEXPLAINED":
      return "liveDiffers";
    case "RUST_PYTHON_MISMATCH":
      return "programsDiffer";
    case "LIVE_UNAVAILABLE":
    case "OK_NO_LIVE":
      return "notCompared";
    default:
      return "unknown";
  }
}

/** A day's state from its facts. */
export function checkState(day: DayView): CheckState {
  return checkStateOf(day.text("verdict") ?? "", {
    identitiesEqual: day.num("agree.live.identities.equal"),
    identitiesTotal: day.num("agree.live.identities.total"),
    walletsEqual: day.num("agree.live.wallets.equal"),
    walletsTotal: day.num("agree.live.wallets.total"),
    differingRecords:
      (day.num("differences.identities") ?? 0) +
      (day.num("differences.wallets") ?? 0),
  });
}

/** The kit's verdict frame for each state (EXPLAINED.md §3 rule 8). */
export const VERDICT_FRAME: Record<CheckState, VerdictState> = {
  equal: "equal",
  knownCause: "knownCause",
  liveDiffers: "differs",
  programsDiffer: "differs",
  notCompared: "missing",
  unknown: "late",
};

/** The ribbon's tile for each state; null for a tile the kit has no word for. */
export const DAY_TILE: Record<CheckState, DayKind | null> = {
  equal: "equal",
  knownCause: "knownCause",
  liveDiffers: "differs",
  programsDiffer: "differs",
  notCompared: null,
  unknown: null,
};

/** "2026-10-18" → "2026-10-18T00:00:00Z": the day's 00:00 UTC snapshot. */
export function snapshotInstant(date: string): string {
  return `${date.slice(0, 10)}T00:00:00Z`;
}
