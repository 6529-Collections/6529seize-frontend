import type { Wei } from "@/lib/stream/types";

/**
 * Uniform-price clearing (D138), ported exactly from the D138 reference model
 * (`model/ref.py`). The contract (`UniformClearing`), its views and this port
 * must agree on every book; `__tests__/lib/stream/clearing.test.ts` checks the
 * port against the model's vectors and against `bruteClear`.
 *
 * Definition, per unit: a bid of q units is q unit bids. P(k) is the k-th
 * highest unit price, revenue(k) = k·P(k) for k up to the cap, R* the best
 * revenue. The result is the LARGEST k with revenue(k) ≥ (1 − margin)·R*, and
 * everyone pays P(k).
 */

/** `marginShare` is out of 100,000, as `IUniformEditionAuction.AuctionConfig`. */
const SHARE = 100_000n;

/** One possible result per used step, scanned from the top (PLAN Appendix B). */
export interface ClearCandidate {
  readonly step: number;
  /** k at this step: units at or above it, capped. */
  readonly count: number;
  /** count × the step's price. */
  readonly revenue: Wei;
  /** Units at steps above this one. */
  readonly above: number;
  /** Live units at this step. */
  readonly units: number;
}

export interface ClearOutcome {
  /** k: how many editions mint. */
  readonly count: number;
  /** s*: the clearing (cut) step, or null with no bids. */
  readonly step: number | null;
  /** The cap binds inside the cut step, so it is filled in queue order. */
  readonly rationed: boolean;
  /** A: units the cut step wins (k − units above it). */
  readonly cutStepUnits: number;
  /** R*: the best candidate revenue. */
  readonly bestRevenue: Wei;
  /** Every candidate, highest step first; the clearing scan stops at the cap. */
  readonly candidates: readonly ClearCandidate[];
  /** Index into `candidates` of the result, or -1. */
  readonly chosen: number;
  /** Index into `candidates` of the best revenue (the first, highest-priced one on a tie), or -1. */
  readonly best: number;
}

const EMPTY: ClearOutcome = {
  count: 0,
  step: null,
  rationed: false,
  cutStepUnits: 0,
  bestRevenue: 0n,
  candidates: [],
  chosen: -1,
  best: -1,
};

type Candidate = ClearCandidate;

function collectCandidates(
  totals: readonly number[],
  prices: readonly Wei[],
  cap: number
): Candidate[] {
  const candidates: Candidate[] = [];
  let demand = 0;
  for (let step = totals.length - 1; step >= 0; step -= 1) {
    const units = totals[step] ?? 0;
    if (units === 0) {
      continue;
    }
    const above = demand;
    if (cap > 0 && above >= cap) {
      break;
    }
    demand += units;
    const count = cap > 0 ? Math.min(demand, cap) : demand;
    const price = prices[step];
    if (price === undefined) {
      throw new RangeError(`no price for step ${step}`);
    }
    candidates.push({
      step,
      count,
      revenue: BigInt(count) * price,
      above,
      units,
    });
  }
  return candidates;
}

/**
 * Clears a book in one pass over the steps.
 * @param totals live units per step, ascending price (index = step)
 * @param prices every step's price
 * @param cap the creator cap; 0 means no cap
 * @param marginShare the breadth margin out of 100,000 (10,000 = 10%)
 */
export function clear(
  totals: readonly number[],
  prices: readonly Wei[],
  cap = 0,
  marginShare = 10_000
): ClearOutcome {
  const candidates = collectCandidates(totals, prices, cap);
  if (candidates.length === 0) {
    return EMPTY;
  }
  let best = 0n;
  let bestIndex = -1;
  candidates.forEach((candidate, index) => {
    if (candidate.revenue > best) {
      best = candidate.revenue;
      bestIndex = index;
    }
  });
  const floor = best * (SHARE - BigInt(marginShare));
  let chosen = -1;
  // Candidates run from the top step down: the last match is the lowest step.
  candidates.forEach((candidate, index) => {
    if (candidate.revenue * SHARE >= floor) {
      chosen = index;
    }
  });
  const pick = candidates[chosen];
  if (pick === undefined) {
    return EMPTY;
  }
  return {
    count: pick.count,
    step: pick.step,
    rationed: pick.count < pick.above + pick.units,
    cutStepUnits: pick.count - pick.above,
    bestRevenue: best,
    candidates,
    chosen,
    best: bestIndex,
  };
}

/** The 90% threshold the result must reach: R* × (100,000 − margin) / 100,000. */
export function revenueThreshold(bestRevenue: Wei, marginShare: number): Wei {
  return (bestRevenue * (SHARE - BigInt(marginShare))) / SHARE;
}

/**
 * The per-unit definition, by brute force: expand every unit, sort, and test
 * every k. For tests and for checking a client against the contract.
 */
export function bruteClear(
  totals: readonly number[],
  prices: readonly Wei[],
  cap = 0,
  marginShare = 10_000
): { readonly count: number; readonly price: Wei | null } {
  const units: Wei[] = [];
  for (let step = totals.length - 1; step >= 0; step -= 1) {
    const price = prices[step] ?? 0n;
    for (let unit = 0; unit < (totals[step] ?? 0); unit += 1) {
      units.push(price);
    }
  }
  const book = cap > 0 ? units.slice(0, cap) : units;
  if (book.length === 0) {
    return { count: 0, price: null };
  }
  const revenues = book.map((price, index) => BigInt(index + 1) * price);
  const best = revenues.reduce((max, value) => (value > max ? value : max), 0n);
  const floor = best * (SHARE - BigInt(marginShare));
  let count = 0;
  revenues.forEach((revenue, index) => {
    if (revenue * SHARE >= floor) {
      count = index + 1;
    }
  });
  return { count, price: book[count - 1] ?? null };
}

/** A hole in a capped step's queue: a raise out of it, or a dispute withdrawal. */
export interface QueueDeparture {
  readonly pos: number;
  readonly qty: number;
}

/**
 * Closes the holes at the cut step (PLAN section 1.6): start at X = A and sweep
 * the step's departures in position order; each one below X adds its units.
 * The contract checks the settler's order is strictly increasing and complete.
 */
export function sweepCutoff(
  cutStepUnits: number,
  departures: readonly QueueDeparture[]
): number {
  const ordered = [...departures].sort((left, right) => left.pos - right.pos);
  let cutoff = cutStepUnits;
  for (const departure of ordered) {
    if (departure.pos >= cutoff) {
      break;
    }
    cutoff += departure.qty;
  }
  return cutoff;
}

/**
 * Units a bid wins: everything above the cut step, nothing below it, and at a
 * rationed cut step `clamp(X − pos, 0, qty)` in queue order.
 */
export function unitsWon(
  bid: { readonly step: number; readonly qty: number; readonly pos: number },
  outcome: Pick<ClearOutcome, "step" | "rationed">,
  cutoff: number
): number {
  if (outcome.step === null || bid.step < outcome.step) {
    return 0;
  }
  if (bid.step > outcome.step || !outcome.rationed) {
    return bid.qty;
  }
  return Math.max(0, Math.min(cutoff - bid.pos, bid.qty));
}
