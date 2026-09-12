import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiCollectTdhTargetItem } from "@/generated/models/ApiCollectTdhTargetItem";
import { ApiMarketTradeOrderSideEnum } from "@/generated/models/ApiMarketTradeOrder";
import {
  ApiCollectTdhTargetPlanStatusEnum,
  type ApiCollectTdhTargetPlan,
} from "@/generated/models/ApiCollectTdhTargetPlan";
import {
  ApiCollectTdhTargetRequestHorizonDaysEnum,
  ApiCollectTdhTargetRequestTargetModeEnum,
  type ApiCollectTdhTargetRequest,
} from "@/generated/models/ApiCollectTdhTargetRequest";
import { getAddress } from "viem";
import {
  collectProfileWallets,
  isCollectProfileWallet,
} from "./collect-recipient.helpers";
import { collectBuyAmount, collectBuyListings } from "./collect-buy.helpers";
import { collectAssetIdentity } from "./collect.adapters";
import type { CollectSelectedListing } from "./collect-selection.helpers";
import type { CollectTdhTargetDraft } from "./collect-tdh-target.types";
import {
  parseCollectTdhTarget,
  parseCollectTdhTargetBudget,
} from "./collect-tdh-target.validation";
import { MARKET_SEAPORT, MARKET_ZERO } from "./market-validation";

const sorted = (values: readonly string[]) =>
  [...values]
    .map((value) => value.toLowerCase())
    .sort((left, right) => left.localeCompare(right))
    .join(":");
function reject(): never {
  throw new Error("COLLECT_TDH_TARGET_MISMATCH");
}
function wei(value: string): bigint {
  if (!/^(0|[1-9]\d{0,77})$/.test(value)) return reject();
  const amount = BigInt(value);
  return amount < 2n ** 256n ? amount : reject();
}
function tdh(value: number): bigint {
  if (!Number.isSafeInteger(value) || value < 0) return reject();
  return BigInt(value);
}

export function collectTdhTargetRequest(
  draft: CollectTdhTargetDraft,
  profile: ApiIdentity,
  recipient: string
): ApiCollectTdhTargetRequest {
  const target = parseCollectTdhTarget(draft.targetTdh);
  const budget = parseCollectTdhTargetBudget(draft.budgetEth);
  const horizon = Object.values(ApiCollectTdhTargetRequestHorizonDaysEnum).find(
    (value) => typeof value === "number" && Number(value) === draft.horizonDays
  );
  const mode = Object.values(ApiCollectTdhTargetRequestTargetModeEnum).find(
    (value) =>
      value.toString() ===
      (draft.mode === "total"
        ? "TOTAL_AT_DEADLINE"
        : "ADDITIONAL_OVER_BASELINE")
  );
  if (
    !profile.id ||
    target === null ||
    budget === null ||
    typeof horizon !== "number" ||
    mode === undefined ||
    !isCollectProfileWallet(profile, recipient)
  )
    return reject();
  return {
    profile_id: profile.id,
    recipient: getAddress(recipient),
    target_tdh: target,
    target_mode: mode,
    horizon_days: horizon,
    families: [draft.family],
    ...(budget !== undefined ? { budget_wei: budget } : {}),
  };
}

function validateRequest(
  plan: ApiCollectTdhTargetPlan,
  expected: ApiCollectTdhTargetRequest,
  profile: ApiIdentity
) {
  const actual = plan.request;
  if (
    actual.profile_id !== expected.profile_id ||
    actual.target_tdh !== expected.target_tdh ||
    actual.target_mode !== expected.target_mode ||
    actual.horizon_days !== expected.horizon_days ||
    actual.recipient.toLowerCase() !== expected.recipient.toLowerCase() ||
    actual.budget_wei !== expected.budget_wei ||
    sorted(actual.families ?? []) !== sorted(expected.families ?? [])
  )
    return reject();
  const projection = plan.projection;
  if (!Number.isFinite(Date.parse(projection.evaluated_at))) return reject();
  const wallets = collectProfileWallets(profile).map((item) => item.wallet);
  if (
    profile.id !== expected.profile_id ||
    projection.account.profile_id !== profile.id ||
    sorted(projection.account.wallets) !== sorted(wallets) ||
    projection.horizon_days !== expected.horizon_days.valueOf() ||
    !isCollectProfileWallet(profile, expected.recipient)
  )
    return reject();
}

function validateTarget(
  plan: ApiCollectTdhTargetPlan,
  expected: ApiCollectTdhTargetRequest
) {
  const projection = plan.projection;
  const baseline = tdh(projection.baseline.boosted_tdh);
  const proposed = tdh(projection.proposed.boosted_tdh);
  const target =
    BigInt(expected.target_tdh) +
    (expected.target_mode?.toString() === "ADDITIONAL_OVER_BASELINE"
      ? baseline
      : 0n);
  const shortfall = target > proposed ? target - proposed : 0n;
  if (
    plan.target_total_tdh !== target.toString() ||
    plan.shortfall_tdh !== shortfall.toString()
  )
    return reject();
  return shortfall;
}

function validateItem(
  item: ApiCollectTdhTargetItem,
  expected: ApiCollectTdhTargetRequest
) {
  const identity = collectAssetIdentity(item.asset.asset_key);
  if (
    identity?.family !== item.asset.family ||
    identity.tokenId !== item.asset.token_id ||
    item.asset.chain_id !== 1 ||
    item.asset.asset_key !==
      `1:${item.asset.contract.toLowerCase()}:${item.asset.token_id}` ||
    !(expected.families ?? []).includes(item.asset.family) ||
    item.recipient.toLowerCase() !== expected.recipient.toLowerCase()
  )
    return reject();
  const amount = collectBuyAmount(item.order, item.quantity);
  if (
    amount === null ||
    item.order.asset_key !== item.asset.asset_key ||
    item.order.currency.toLowerCase() !== MARKET_ZERO ||
    item.order.side !== ApiMarketTradeOrderSideEnum.Listing ||
    item.order.identity.protocol_address.toLowerCase() !== MARKET_SEAPORT ||
    !/^0x[\da-f]{64}$/i.test(item.order.identity.order_hash)
  )
    return reject();
  const quantity = wei(item.quantity),
    quoted = wei(item.order.quantity);
  let fees = 0n;
  for (const fee of item.order.fees)
    fees += (wei(fee.amount_wei) * quantity) / quoted;
  if ((wei(item.order.net_wei) * quantity) / quoted + fees !== wei(amount))
    return reject();
  return { quantity, amount: wei(amount), fees };
}

function validateAcquisitions(
  plan: ApiCollectTdhTargetPlan,
  expected: ApiCollectTdhTargetRequest
) {
  let total = 0n,
    fees = 0n;
  const seen = new Set<string>();
  const allocations = new Map<string, bigint>();
  const uniqueAssets = new Set<string>();
  for (const item of plan.items) {
    const key = `${item.order.identity.protocol_address.toLowerCase()}:${item.order.identity.order_hash.toLowerCase()}`;
    if (seen.has(key)) return reject();
    seen.add(key);
    const checked = validateItem(item, expected);
    if (
      item.asset.family !== ApiCollectFamily.Memes &&
      (checked.quantity !== 1n || uniqueAssets.has(item.asset.asset_key))
    )
      return reject();
    uniqueAssets.add(item.asset.asset_key);
    total += checked.amount;
    fees += checked.fees;
    const allocationKey = `${item.asset.asset_key}:${item.recipient.toLowerCase()}`;
    allocations.set(
      allocationKey,
      (allocations.get(allocationKey) ?? 0n) + checked.quantity
    );
  }
  if (
    total !== wei(plan.purchase_cost_wei) ||
    fees !== wei(plan.signed_fees_wei) ||
    fees > total ||
    (expected.budget_wei !== undefined && total > wei(expected.budget_wei))
  )
    return reject();
  const projectedAllocations = new Map<string, bigint>();
  for (const item of plan.projection.recipient_allocations) {
    if (!item.counts_toward_profile) return reject();
    const key = `${item.asset_key}:${item.recipient.toLowerCase()}`;
    projectedAllocations.set(
      key,
      (projectedAllocations.get(key) ?? 0n) + wei(item.quantity)
    );
  }
  if (
    allocations.size !== projectedAllocations.size ||
    [...allocations].some(
      ([key, quantity]) => projectedAllocations.get(key) !== quantity
    )
  )
    return reject();
  return total;
}

/** Bind the displayed analysis to its profile, requested deadline and exact proposed acquisitions. */
export function validateCollectTdhTargetPlan(
  plan: ApiCollectTdhTargetPlan,
  expected: ApiCollectTdhTargetRequest,
  profile: ApiIdentity
): void {
  if (!Object.values(ApiCollectTdhTargetPlanStatusEnum).includes(plan.status))
    return reject();
  validateRequest(plan, expected, profile);
  const shortfall = validateTarget(plan, expected);
  const total = validateAcquisitions(plan, expected);
  if (
    plan.status.toString() === "NO_PURCHASE_NEEDED" &&
    (plan.items.length > 0 ||
      total !== 0n ||
      shortfall !== 0n ||
      plan.projection.proposed.boosted_tdh !==
        plan.projection.baseline.boosted_tdh)
  )
    return reject();
  if (plan.status.toString() === "TARGET_MET_BEST_FOUND" && shortfall !== 0n)
    return reject();
  if (
    plan.gas_estimate_wei !== null &&
    (plan.funding_estimate_wei === null ||
      wei(plan.funding_estimate_wei) !== total + wei(plan.gas_estimate_wei))
  )
    return reject();
  if (plan.gas_estimate_wei === null && plan.funding_estimate_wei !== null)
    return reject();
}

export function collectTdhTargetSelection(
  plan: ApiCollectTdhTargetPlan,
  profile: ApiIdentity,
  now = Date.now()
): CollectSelectedListing[] {
  validateCollectTdhTargetPlan(plan, plan.request, profile);
  if (
    !plan.items.length ||
    !plan.valid_until ||
    !Number.isFinite(Date.parse(plan.valid_until)) ||
    Date.parse(plan.valid_until) <= now
  )
    return reject();
  const profileWallets = collectProfileWallets(profile).map(
    (item) => item.wallet
  );
  return plan.items.map((item) => {
    if (
      collectBuyListings({
        orders: [item.order],
        assetKey: item.asset.asset_key,
        quantity: item.quantity,
        profileWallets,
        nowSeconds: now / 1000,
      }).length !== 1
    )
      return reject();
    return { asset: item.asset, order: item.order, quantity: item.quantity };
  });
}
