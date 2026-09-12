import { offerBuyOptions } from "./collect-offer-blend.helpers";
import {
  COLLECT_ANALYSIS_CLOCK_SKEW_MS,
  offerQuantity,
  offerUnitWei,
} from "./collect-offer-plan.helpers";
import type {
  OfferPlanAnalysisView,
  OfferPlanPrice,
  OfferPlanRow,
} from "./collect-offer-plan.types";

export type BlendTier = "conservative" | "base" | "aggressive";
export type BlendRoute = "buy" | "offer";
type BlendReason =
  | "excluded"
  | "locked"
  | "invalid_quantity"
  | "manual_price"
  | "manual_buy"
  | "manual_offer"
  | "buy_unavailable"
  | "stale_reference"
  | "no_reference"
  | "crossed_market"
  | "tight_spread"
  | "spread_offer"
  | "ask_offer"
  | "ask_buy"
  | "bid_only"
  | "invalid_amount";

export interface BlendedPolicyInput {
  readonly tier: BlendTier;
  readonly rows: readonly OfferPlanRow[];
  /** The original, validated bid analysis, never its subsequent MANUAL funding check. */
  readonly analysis: OfferPlanAnalysisView | null;
  readonly buyOptions: ReturnType<typeof offerBuyOptions>;
  /** Evaluation time of the same exact acquisition plan that supplied buyOptions. */
  readonly buyObservedAt?: string | undefined;
  readonly nowMs?: number | undefined;
  readonly lockedAssetKeys?: ReadonlySet<string> | undefined;
  readonly routeOverrides?: ReadonlyMap<string, BlendRoute> | undefined;
}

interface BlendedRowProposal {
  readonly assetKey: string;
  readonly route: BlendRoute | "manual" | "locked" | "excluded";
  readonly unitAmountWei: string | null;
  readonly reason: BlendReason;
  /** Original evidence deadline; a new MANUAL response must not renew it. */
  readonly sourceValidUntil: string | null;
}

interface BlendedPolicyProposal {
  readonly rows: readonly BlendedRowProposal[];
  /** Includes explicit buy choices even when their evidence needs refreshing. */
  readonly buyKeys: ReadonlySet<string>;
  readonly sourceValidUntil: string | null;
}

const UINT_MAX = (1n << 256n) - 1n;
const ANALYSIS_WINDOW_MS = 60_000;
const REFERENCE_AGE_MS = 3_600_000;

// Disclosed proposal defaults, not calibrated valuations or fill probabilities.
const TIERS: Record<
  BlendTier,
  { gapParts: bigint; buyBps: bigint; askPct: bigint }
> = {
  conservative: { gapParts: 0n, buyBps: 200n, askPct: 70n },
  base: { gapParts: 1n, buyBps: 800n, askPct: 85n },
  aggressive: { gapParts: 2n, buyBps: 2000n, askPct: 0n },
};

function positiveWei(value: string): bigint | null {
  if (!/^[1-9]\d{0,77}$/.test(value)) return null;
  const amount = BigInt(value);
  return amount <= UINT_MAX ? amount : null;
}

function timestamp(value: string | undefined): number | null {
  if (!value) return null;
  const at = Date.parse(value);
  return Number.isSafeInteger(at) && at > 0 ? at : null;
}

function analysisDeadline(analysis: OfferPlanAnalysisView | null, now: number) {
  if (!analysis || !Number.isSafeInteger(now) || now <= 0) return null;
  const created = timestamp(analysis.createdAt);
  const until = timestamp(analysis.validUntil);
  if (
    created === null ||
    until === null ||
    created > now + COLLECT_ANALYSIS_CLOCK_SKEW_MS ||
    until <= now ||
    until <= created ||
    until > created + ANALYSIS_WINDOW_MS
  )
    return null;
  return until;
}

function buyEvidence(
  input: BlendedPolicyInput,
  row: OfferPlanRow,
  now: number
) {
  const candidate = input.buyOptions.get(row.assetKey);
  if (!candidate) return null;
  // Rebind a possibly retained map to the current row quantity and exact signed legs.
  const exact = offerBuyOptions([row], candidate.legs).get(row.assetKey);
  if (exact?.costWei !== candidate.costWei) return null;
  const amount = positiveWei(exact.costWei);
  const observed = timestamp(input.buyObservedAt);
  if (amount === null) return null;
  const until = observed === null ? null : observed + ANALYSIS_WINDOW_MS;
  return {
    amount,
    until:
      observed !== null &&
      observed <= now + COLLECT_ANALYSIS_CLOCK_SKEW_MS &&
      until !== null &&
      until > now
        ? until
        : null,
  };
}

function observedBid(price: OfferPlanPrice, now: number) {
  if (price.references.length !== 1) return null;
  const reference = price.references[0]!;
  const observed = timestamp(reference.observedAt);
  if (
    reference.kind !== "bid" ||
    reference.currency !== "WETH" ||
    observed === null ||
    observed > now + COLLECT_ANALYSIS_CLOCK_SKEW_MS ||
    observed + REFERENCE_AGE_MS <= now
  )
    return null;
  const amount = positiveWei(reference.amountWei);
  return amount === null
    ? null
    : { amount, until: observed + REFERENCE_AGE_MS };
}

function result(
  row: OfferPlanRow,
  route: BlendedRowProposal["route"],
  reason: BlendReason,
  unit: bigint | null = null,
  until: number | null = null
): BlendedRowProposal {
  return {
    assetKey: row.assetKey,
    route,
    unitAmountWei: unit?.toString() ?? null,
    reason,
    sourceValidUntil: until === null ? null : new Date(until).toISOString(),
  };
}

function pricedResult(
  row: OfferPlanRow,
  unit: bigint,
  quantity: bigint,
  reason: BlendReason,
  until: number
) {
  if (unit <= 0n || unit * quantity > UINT_MAX)
    return result(row, "manual", "invalid_amount");
  return result(row, "offer", reason, unit, until);
}

function askOnlyProposal(
  row: OfferPlanRow,
  quantity: bigint,
  tier: BlendTier,
  ask: { readonly amount: bigint; readonly deadline: number },
  allowBuy: boolean
) {
  if (tier === "aggressive")
    return allowBuy
      ? result(row, "buy", "ask_buy", null, ask.deadline)
      : result(row, "offer", "manual_offer");
  return pricedResult(
    row,
    (ask.amount * TIERS[tier].askPct) / (100n * quantity),
    quantity,
    "ask_offer",
    ask.deadline
  );
}

function marketProposal(
  input: BlendedPolicyInput,
  row: OfferPlanRow,
  quantity: bigint,
  now: number,
  allowBuy: boolean
): BlendedRowProposal {
  const until = analysisDeadline(input.analysis, now);
  if (until === null) return result(row, "manual", "stale_reference");
  const price = input.analysis?.prices.find(
    (item) => item.assetKey === row.assetKey
  );
  if (price?.quantity !== row.quantity)
    return result(row, "manual", "no_reference");
  const bid = observedBid(price, now);
  const buy = buyEvidence(input, row, now);
  const ask = buy?.until === null ? null : buy;
  const policy = TIERS[input.tier];
  if (!ask) {
    if (bid === null) return result(row, "manual", "no_reference");
    return pricedResult(
      row,
      bid.amount,
      quantity,
      "bid_only",
      Math.min(until, bid.until)
    );
  }
  const deadline = Math.min(until, ask.until!, bid?.until ?? Infinity);
  if (bid === null) {
    if (price.references.length > 0)
      return result(row, "manual", "no_reference");
    return askOnlyProposal(
      row,
      quantity,
      input.tier,
      { amount: ask.amount, deadline },
      allowBuy
    );
  }
  const bidTotal = bid.amount * quantity;
  if (bidTotal > UINT_MAX) return result(row, "manual", "invalid_amount");
  if (bidTotal >= ask.amount) return result(row, "manual", "crossed_market");
  const gap = ask.amount - bidTotal;
  if (allowBuy && gap * 10_000n <= ask.amount * policy.buyBps)
    return result(row, "buy", "tight_spread", null, deadline);
  return pricedResult(
    row,
    bid.amount + (gap * policy.gapParts) / (3n * quantity),
    quantity,
    "spread_offer",
    deadline
  );
}

function proposeRow(input: BlendedPolicyInput, row: OfferPlanRow, now: number) {
  if (input.lockedAssetKeys?.has(row.assetKey))
    return result(row, "locked", "locked");
  if (!row.selected) return result(row, "excluded", "excluded");
  const override = input.routeOverrides?.get(row.assetKey);
  const quantity = offerQuantity(row);
  if (quantity === null)
    return result(row, override ?? "manual", "invalid_quantity");
  const pinned = row.pinned ? offerUnitWei(row.unitPriceEth) : null;
  const pinnedUnit =
    pinned !== null && pinned * quantity <= UINT_MAX ? pinned : null;
  if (override === "buy") {
    const buy = buyEvidence(input, row, now);
    if (!buy) return result(row, "buy", "buy_unavailable", pinnedUnit);
    if (buy.until === null)
      return result(row, "buy", "stale_reference", pinnedUnit);
    return result(row, "buy", "manual_buy", pinnedUnit, buy.until);
  }
  if (row.pinned) {
    return result(row, "offer", "manual_price", pinnedUnit);
  }
  const proposal = marketProposal(
    input,
    row,
    quantity,
    now,
    override !== "offer"
  );
  // A route pin prevents an automatic buy, but never fabricates an offer price.
  return override === "offer"
    ? { ...proposal, route: "offer" as const }
    : proposal;
}

/** Advisory prices only. Final analysis and purchase review own budgets, funding and execution. */
export function proposeBlendedPolicy(
  input: BlendedPolicyInput
): BlendedPolicyProposal {
  const now = input.nowMs ?? Date.now();
  const rows = input.rows.map((row) => proposeRow(input, row, now));
  const deadlines = rows.flatMap((row) =>
    row.sourceValidUntil === null ? [] : [row.sourceValidUntil]
  );
  return {
    rows,
    buyKeys: new Set(
      rows.filter((row) => row.route === "buy").map((row) => row.assetKey)
    ),
    sourceValidUntil:
      deadlines.length === 0
        ? null
        : deadlines.reduce(
            (left, right) => (left < right ? left : right),
            deadlines[0]!
          ),
  };
}
