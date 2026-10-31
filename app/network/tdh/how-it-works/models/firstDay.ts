import { wholeDays } from "@/components/explained/engine/tdh";

/**
 * "A card ages" (TDH-DESIGN.md §5.3): when a copy's first whole day is
 * counted. A result is dated by its snapshot, the last block before 00:00
 * UTC of its day, drawn here at the day boundary `T = day_s × N` (P26 §4.1).
 * A copy held at `T` adds `(T − a) div day_s` whole days (§4.3); the first
 * result that counts it is the first snapshot that finds a whole day.
 *
 * The example copy arrives at the facts layer's constructed instant
 * (`example.firstCard.arrivedAt`); its two neighbours are one minute before
 * and one minute after the next day boundary, and the Break it sells it a
 * fixed time after it arrived. Every day count is the engine's.
 */

/** How many snapshots the timeline draws. */
const SNAPSHOTS = 4;
/** The Break it sells the copy this many hours after it arrived. */
const SELL_AFTER_HOURS = 17;
const MINUTE = 60;
const HOUR = 3_600;

export type ArrivalKey = "example" | "beforeMidnight" | "afterMidnight";

export const ARRIVAL_KEYS: readonly ArrivalKey[] = [
  "example",
  "beforeMidnight",
  "afterMidnight",
];

export interface FirstDayWorld {
  /** The example arrival, in seconds. */
  readonly example: number;
  /** Seconds in a day (the registry's `day_s`). */
  readonly dayS: number;
}

/** The instant of an arrival option, in seconds. */
export function arrivalAt(world: FirstDayWorld, key: ArrivalKey): number {
  const nextBoundary =
    (Math.floor(world.example / world.dayS) + 1) * world.dayS;
  if (key === "beforeMidnight") return nextBoundary - MINUTE;
  if (key === "afterMidnight") return nextBoundary + MINUTE;
  return world.example;
}

/** The snapshots drawn: the boundary before the example's day, then four. */
export function snapshotTimes(world: FirstDayWorld): {
  readonly start: number;
  readonly times: readonly number[];
} {
  const start = (Math.floor(world.example / world.dayS) - 1) * world.dayS;
  const times = Array.from(
    { length: SNAPSHOTS },
    (_, index) => start + (index + 1) * world.dayS
  );
  return { start, times };
}

export interface Snapshot {
  readonly T: number;
  /** Whole days the copy has at `T`; 0 when not held then. */
  readonly days: number;
  readonly held: boolean;
}

export interface FirstDayResult {
  readonly arrived: number;
  readonly sold: number | null;
  /** The span drawn, in seconds. */
  readonly start: number;
  readonly end: number;
  readonly snapshots: readonly Snapshot[];
  /** The first snapshot that counts a whole day, or null. */
  readonly first: number | null;
  /** Seconds held at the first counting snapshot. */
  readonly heldAtFirst: number | null;
  /** Seconds held at the snapshot before it, when the copy was held then. */
  readonly heldBefore: number | null;
}

export function firstDay(
  world: FirstDayWorld,
  key: ArrivalKey,
  sell: boolean
): FirstDayResult {
  const arrived = arrivalAt(world, key);
  const sold = sell ? arrived + SELL_AFTER_HOURS * HOUR : null;
  const { start, times } = snapshotTimes(world);
  const snapshots = times.map((T) => {
    const held = T > arrived && (sold === null || sold > T);
    return {
      T,
      held,
      days: held ? wholeDays(T, arrived, world.dayS) : 0,
    };
  });
  const firstSnap = snapshots.find((snap) => snap.held && snap.days >= 1);
  const first = firstSnap?.T ?? null;
  const before = first === null ? null : first - world.dayS;
  return {
    arrived,
    sold,
    start,
    end: start + SNAPSHOTS * world.dayS,
    snapshots,
    first,
    heldAtFirst: first === null ? null : first - arrived,
    heldBefore: before !== null && before > arrived ? before - arrived : null,
  };
}

/** Hours and minutes of a span of seconds, for "28 h 55 min". */
export function hoursAndMinutes(seconds: number): {
  readonly hours: number;
  readonly minutes: number;
} {
  return {
    hours: Math.floor(seconds / HOUR),
    minutes: Math.round((seconds % HOUR) / MINUTE),
  };
}
