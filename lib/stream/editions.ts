/**
 * How an edition sale's count and price come out, for display. The contract's
 * `clearing(saleId)` is the source of truth for the result; this rebuilds the
 * candidate counts it chose between, so the page can show "editions x price =
 * ETH raised" for each one.
 */
interface ClearingCandidate {
  readonly step: number;
  /** Copies sold if this step were the price. */
  readonly count: number;
  readonly price: bigint;
  readonly revenue: bigint;
  /** Units bid at exactly this step. */
  readonly unitsAtStep: number;
}

interface ClearingCandidates {
  readonly candidates: readonly ClearingCandidate[];
  readonly bestRevenue: bigint;
  /** Index into candidates of the chosen result, or -1 with no bids. */
  readonly pick: number;
}

/**
 * Scans used steps from the top, as the contract does: step s offers
 * min(units at or above s, cap) copies at price(s). The result is the
 * lowest-priced candidate within `marginShare` (out of 100,000) of the best revenue.
 */
export function clearingCandidates(args: {
  readonly prices: readonly bigint[];
  /** Units at each step, indexed by step. */
  readonly unitsByStep: readonly number[];
  /** Creator cap, 0 for none. */
  readonly cap: number;
  readonly marginShare: number;
}): ClearingCandidates {
  const candidates: ClearingCandidate[] = [];
  let atOrAbove = 0;
  let bestRevenue = 0n;
  for (let step = args.unitsByStep.length - 1; step >= 0; step--) {
    const units = args.unitsByStep[step] ?? 0;
    if (!units) continue;
    if (args.cap && atOrAbove >= args.cap) break;
    atOrAbove += units;
    const count = args.cap ? Math.min(atOrAbove, args.cap) : atOrAbove;
    const price = args.prices[step] ?? 0n;
    const revenue = BigInt(count) * price;
    candidates.push({ step, count, price, revenue, unitsAtStep: units });
    if (revenue > bestRevenue) bestRevenue = revenue;
  }
  let pick = -1;
  const keep = BigInt(100_000 - args.marginShare);
  candidates.forEach((candidate, index) => {
    if (candidate.revenue * 100_000n >= bestRevenue * keep) pick = index;
  });
  return { candidates, bestRevenue, pick };
}

/** Units per step, from `stepTotals(saleId)` (lowStep and the units from it upward). */
export function unitsByStepFrom(lowStep: number, units: readonly bigint[]): number[] {
  const out: number[] = [];
  units.forEach((value, offset) => {
    out[lowStep + offset] = Number(value);
  });
  for (let i = 0; i < out.length; i++) out[i] ??= 0;
  return out;
}

export type BidStanding = "in" | "part" | "out";

/** Whether a live bid at `step` for `quantity` is in at the current result. */
export function bidStanding(args: {
  readonly step: number;
  readonly clearingStep: number | null;
  readonly rationed: boolean;
}): BidStanding {
  if (args.clearingStep === null) return "out";
  if (args.step > args.clearingStep) return "in";
  if (args.step < args.clearingStep) return "out";
  return args.rationed ? "part" : "in";
}

/** The ladder step whose price is nearest `wei` (the lower on a tie). */
export function nearestStep(prices: readonly bigint[], wei: bigint): number {
  let best = 0;
  let bestDistance: bigint | null = null;
  prices.forEach((price, step) => {
    const distance = price > wei ? price - wei : wei - price;
    if (bestDistance === null || distance < bestDistance) {
      bestDistance = distance;
      best = step;
    }
  });
  return best;
}

/**
 * The lowest price step a bid can be raised to so that all of it would win
 * if bidding closed now. The bid's own units are moved, not counted twice.
 * Returns null when no higher step would get it in.
 */
export function raiseTargetStep(args: {
  readonly prices: readonly bigint[];
  readonly unitsByStep: readonly number[];
  readonly cap: number;
  readonly marginShare: number;
  readonly fromStep: number;
  readonly quantity: number;
}): number | null {
  const base = Array.from({ length: args.prices.length }, (_, step) => args.unitsByStep[step] ?? 0);
  base[args.fromStep] = Math.max(0, (base[args.fromStep] ?? 0) - args.quantity);
  for (let step = args.fromStep + 1; step < args.prices.length; step++) {
    const units = base.slice();
    units[step] = (units[step] ?? 0) + args.quantity;
    const { candidates, pick } = clearingCandidates({
      prices: args.prices,
      unitsByStep: units,
      cap: args.cap,
      marginShare: args.marginShare,
    });
    const chosen = candidates[pick];
    if (!chosen) continue;
    // A raised bid joins the back of its new step, so with a cap every other unit at or
    // above that step comes first.
    const othersAtOrAbove = base.slice(step).reduce((sum, value) => sum + value, 0);
    const fits = args.cap === 0 || othersAtOrAbove + args.quantity <= args.cap;
    if (chosen.step <= step && fits) return step;
  }
  return null;
}
