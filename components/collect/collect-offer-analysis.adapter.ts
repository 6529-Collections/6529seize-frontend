import type { ApiCollectOfferAnalysis } from "@/generated/models/ApiCollectOfferAnalysis";
import type { ApiCollectOfferAnalysisRequest } from "@/generated/models/ApiCollectOfferAnalysisRequest";
import type { ApiCollectOfferAnalysisRow } from "@/generated/models/ApiCollectOfferAnalysisRow";
import { ApiCollectOfferAnalysisMethodKindEnum } from "@/generated/models/ApiCollectOfferAnalysisMethod";
import { ApiCollectOfferAnalysisRowStatusEnum } from "@/generated/models/ApiCollectOfferAnalysisRow";
import { ApiCollectOfferPriceReferenceKindEnum } from "@/generated/models/ApiCollectOfferPriceReference";
import { isAddress } from "viem";
import { collectAssetIdentity } from "./collect.adapters";
import {
  OFFER_EXPIRY_HOURS,
  offerBasisPoints,
  offerQuantity,
  offerRowTotal,
  offerUnitWei,
} from "./collect-offer-plan.helpers";
import type {
  OfferPlanAnalysisInput,
  OfferPlanAnalysisView,
  OfferPlanPrice,
  OfferPriceMethod,
} from "./collect-offer-plan.types";
import { MARKET_WETH, MARKET_ZERO } from "./market-validation";
import { collectOrderExpiry } from "./collect-order-expiry";

const UINT_MAX = 2n ** 256n - 1n;
const METHODS: Record<OfferPriceMethod, ApiCollectOfferAnalysisMethodKindEnum> =
  {
    manual: ApiCollectOfferAnalysisMethodKindEnum.Manual,
    match_bid: ApiCollectOfferAnalysisMethodKindEnum.MatchBid,
    improve_bid: ApiCollectOfferAnalysisMethodKindEnum.ImproveBid,
    discount_ask: ApiCollectOfferAnalysisMethodKindEnum.DiscountAsk,
    goal: ApiCollectOfferAnalysisMethodKindEnum.Goal,
  };

function requireValid(value: unknown): asserts value {
  if (!Boolean(value)) throw new Error("COLLECT_OFFER_ANALYSIS_MISMATCH");
}
function uint(value: string): bigint {
  requireValid(typeof value === "string" && /^(0|[1-9]\d{0,77})$/.test(value));
  const amount = BigInt(value);
  requireValid(amount <= UINT_MAX);
  return amount;
}
function sameAddress(left: string, right: string): boolean {
  return typeof left === "string" && left.toLowerCase() === right.toLowerCase();
}
function timestamp(value: number): string {
  requireValid(Number.isSafeInteger(value) && value > 0 && value < 8.64e15);
  return new Date(value).toISOString();
}

/** A goal cap funds only the unsent proposals; actual published commitments stay spent. */
export function buildOfferAnalysisRequest(
  input: OfferPlanAnalysisInput,
  now = Date.now()
): ApiCollectOfferAnalysisRequest {
  requireValid(input.profileId && isAddress(input.wallet));
  requireValid(input.rows.length > 0 && input.rows.length <= 1000);
  requireValid(
    new Set(input.rows.map((row) => row.assetKey)).size === input.rows.length
  );
  requireValid(
    OFFER_EXPIRY_HOURS.some((hours) => hours === input.controls.expiryHours)
  );
  const kind = METHODS[input.controls.method];
  requireValid(
    Object.values(ApiCollectOfferAnalysisMethodKindEnum).includes(kind)
  );
  const percentage =
    input.controls.method === "improve_bid" ||
    input.controls.method === "discount_ask";
  const points = percentage
    ? offerBasisPoints(input.controls.percent, input.controls.method)
    : null;
  requireValid(!percentage || points !== null);
  const assets = input.rows.map((row) => {
    requireValid(
      row.selected &&
        row.assetKey.split(":").length === 3 &&
        offerQuantity(row) !== null
    );
    const manual = input.controls.method === "manual" || row.pinned;
    requireValid(!manual || offerRowTotal(row) !== null);
    return {
      asset_key: row.assetKey,
      quantity: row.quantity,
      ...(manual
        ? { manual_unit_amount_wei: offerUnitWei(row.unitPriceEth)!.toString() }
        : {}),
    };
  });
  const committed = uint(input.committedAmountWei);
  const budget =
    input.controls.method === "goal"
      ? offerUnitWei(input.controls.budgetEth)
      : null;
  requireValid(
    input.controls.method !== "goal" || (budget !== null && budget > committed)
  );
  return {
    profile_id: input.profileId,
    wallet: input.wallet,
    recipient: input.wallet,
    acknowledge_external_recipient: false,
    expires_at: collectOrderExpiry(input.controls.expiryHours, now),
    assets,
    method: { kind, ...(points === null ? {} : { basis_points: points }) },
    ...(budget === null
      ? {}
      : { max_total_weth_wei: (budget - committed).toString() }),
  };
}

function priceView(
  row: ApiCollectOfferAnalysisRow,
  expected: ApiCollectOfferAnalysisRequest["assets"][number]
): OfferPlanPrice {
  requireValid(
    row.asset_key === expected.asset_key && row.quantity === expected.quantity
  );
  requireValid(
    typeof row.selected === "boolean" &&
      row.pinned === (expected.manual_unit_amount_wei !== undefined)
  );
  requireValid(
    ["PRICED", "UNAVAILABLE", "EXCLUDED_BUDGET", "PIN_CONFLICT"].includes(
      row.status
    )
  );
  requireValid(
    Array.isArray(row.reason_codes) &&
      row.reason_codes.every((reason) => typeof reason === "string")
  );
  requireValid(Array.isArray(row.references) && row.references.length <= 20);
  const unit =
    row.unit_amount_wei === undefined ? null : uint(row.unit_amount_wei);
  const total =
    row.total_amount_wei === undefined ? null : uint(row.total_amount_wei);
  requireValid(
    unit === null
      ? total === null
      : unit > 0n && total === unit * BigInt(row.quantity)
  );
  requireValid(
    !row.selected ||
      (row.status === ApiCollectOfferAnalysisRowStatusEnum.Priced &&
        total !== null)
  );
  // A missing unsupported pin can stay unresolved, but a returned manual price must match exactly.
  requireValid(
    expected.manual_unit_amount_wei === undefined ||
      unit === null ||
      unit.toString() === expected.manual_unit_amount_wei
  );
  if (row.asset) {
    const identity = collectAssetIdentity(row.asset_key);
    requireValid(
      identity &&
        row.asset.asset_key === row.asset_key &&
        row.asset.chain_id === 1
    );
    requireValid(
      row.asset.family === identity.family &&
        row.asset.token_id === identity.tokenId
    );
    requireValid(sameAddress(row.asset.contract, row.asset_key.split(":")[1]!));
  }
  return {
    assetKey: row.asset_key,
    ...(row.asset ? { asset: row.asset } : {}),
    quantity: row.quantity,
    status: row.status,
    unitAmountWei: unit?.toString() ?? null,
    selected: row.selected,
    reasons: row.reason_codes,
    references: row.references.map((reference) => {
      requireValid(
        Object.values(ApiCollectOfferPriceReferenceKindEnum).includes(
          reference.kind
        )
      );
      let currency: "ETH" | "WETH" | null = null;
      if (sameAddress(reference.currency, MARKET_WETH)) currency = "WETH";
      if (sameAddress(reference.currency, MARKET_ZERO)) currency = "ETH";
      requireValid(
        currency !== null &&
          (reference.kind !== ApiCollectOfferPriceReferenceKindEnum.Bid ||
            currency === "WETH")
      );
      requireValid(
        reference.eligibility === "EXACT_TOKEN_TERMS" &&
          reference.verification === "OBSERVED_NOT_CHAIN_VERIFIED" &&
          reference.funding === "UNKNOWN"
      );
      const amount = uint(reference.unit_amount_wei),
        quantity = uint(reference.quantity);
      requireValid(
        amount > 0n &&
          quantity > 0n &&
          uint(reference.total_amount_wei) === amount * quantity
      );
      requireValid(reference.expires_at > reference.observed_at);
      return {
        kind: reference.kind,
        amountWei: amount.toString(),
        currency,
        observedAt: timestamp(reference.observed_at),
      };
    }),
  };
}

/** Bind advisory rows to this request. Execution always starts a separate fresh single-offer review. */
export function offerAnalysisView(
  result: ApiCollectOfferAnalysis,
  request: ApiCollectOfferAnalysisRequest,
  now = Date.now()
): OfferPlanAnalysisView {
  requireValid(
    result.profile_id === request.profile_id &&
      sameAddress(result.wallet, request.wallet) &&
      sameAddress(result.recipient, request.wallet)
  );
  requireValid(
    sameAddress(result.currency, MARKET_WETH) &&
      result.signing_policy === "INDIVIDUAL_OFFERS"
  );
  requireValid(
    typeof result.analysis_id === "string" &&
      result.analysis_id.length > 0 &&
      typeof result.policy_version === "string" &&
      typeof result.policy_description === "string"
  );
  const createdAt = timestamp(result.created_at),
    validUntil = timestamp(result.valid_until);
  requireValid(
    result.valid_until > now &&
      result.valid_until > result.created_at &&
      result.valid_until <= result.created_at + 60000
  );
  requireValid(
    result.coverage.complete === false &&
      result.coverage.funding_reserved === false &&
      result.coverage.execution_verified === false
  );
  requireValid(
    Array.isArray(result.rows) && result.rows.length === request.assets.length
  );
  const expected = new Map(
    request.assets.map((asset) => [asset.asset_key, asset])
  );
  requireValid(
    new Set(result.rows.map((row) => row.asset_key)).size === result.rows.length
  );
  const prices = result.rows.map((row) => {
    const asset = expected.get(row.asset_key);
    requireValid(asset);
    return priceView(row, asset);
  });
  const totals = result.totals;
  const proposed = uint(totals.proposed_weth_wei),
    available = uint(totals.available_weth_wei);
  const balance = uint(totals.weth_balance_wei),
    liability = uint(totals.tracked_payer_liability_wei);
  requireValid(available === (balance > liability ? balance - liability : 0n));
  requireValid(totals.budget_wei === request.max_total_weth_wei);
  const budget =
    request.max_total_weth_wei === undefined
      ? available
      : uint(request.max_total_weth_wei);
  const capacity = budget < available ? budget : available;
  const selected = result.rows
    .filter((row) => row.selected)
    .reduce((sum, row) => sum + uint(row.total_amount_wei!), 0n);
  requireValid(
    selected === proposed &&
      proposed <= capacity &&
      uint(totals.unallocated_weth_wei) === capacity - proposed
  );
  return {
    id: result.analysis_id,
    policy: result.policy_version,
    policyDescription: result.policy_description,
    createdAt,
    validUntil,
    prices,
    trackedLiabilityWei: liability.toString(),
    balanceWei: balance.toString(),
    availableWei: available.toString(),
    unallocatedWei: totals.unallocated_weth_wei,
  };
}
