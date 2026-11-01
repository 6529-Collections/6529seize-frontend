import { type ClearOutcome, revenueThreshold } from "@/lib/stream/clearing";
import type {
  EditionCandidate,
  EditionStepTotal,
  Wei,
} from "@/lib/stream/types";

/**
 * Read models for the edition auction's order book and "why this many" list,
 * built from live units per step and a clearing result. The mock and the
 * chain source share them, so both show the same rows for the same book.
 */

function stepStatus(
  step: number,
  result: Pick<ClearOutcome, "step" | "rationed">
): EditionStepTotal["status"] {
  if (result.step === null || step < result.step) {
    return "out";
  }
  return step === result.step && result.rationed ? "part" : "in";
}

/** Rows for used steps, ascending; running totals count from the top. */
export function stepTotalRows(
  live: readonly number[],
  prices: readonly Wei[],
  cap: number,
  result: Pick<ClearOutcome, "step" | "rationed" | "cutUnits">
): EditionStepTotal[] {
  const rows: EditionStepTotal[] = [];
  let cumulative = 0;
  for (let step = live.length - 1; step >= 0; step -= 1) {
    const units = live[step] ?? 0;
    if (units > 0) {
      cumulative += units;
      const price = prices[step] ?? 0n;
      const count = cap > 0 ? Math.min(cumulative, cap) : cumulative;
      const status = stepStatus(step, result);
      let won = 0;
      if (status === "in") {
        won = units;
      } else if (status === "part") {
        won = result.cutUnits;
      }
      rows.push({
        step,
        price,
        units,
        cumulative,
        revenue: BigInt(count) * price,
        status,
        won,
      });
    }
  }
  return rows.reverse();
}

/** The candidate results, highest step first, with the chosen one and the best. */
export function candidateRows(
  result: ClearOutcome,
  prices: readonly Wei[],
  marginShare: number
): EditionCandidate[] {
  const threshold = revenueThreshold(result.bestRevenue, marginShare);
  return result.candidates.map((candidate, index) => ({
    step: candidate.step,
    price: prices[candidate.step] ?? 0n,
    count: candidate.count,
    revenue: candidate.revenue,
    shareOfBestBps:
      result.bestRevenue === 0n
        ? 0
        : Number((candidate.revenue * 10_000n) / result.bestRevenue),
    chosen: index === result.chosen,
    best: index === result.best,
    qualifies: candidate.revenue >= threshold,
  }));
}
