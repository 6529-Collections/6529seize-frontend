import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import {
  ApiCollectDailyTdhPlanStatusEnum,
  type ApiCollectDailyTdhPlan,
} from "@/generated/models/ApiCollectDailyTdhPlan";
import {
  ApiCollectDailyTdhRequestModeEnum,
  type ApiCollectDailyTdhRequest,
} from "@/generated/models/ApiCollectDailyTdhRequest";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  formatEther,
  formatUnits,
  getAddress,
  parseEther,
  parseUnits,
} from "viem";
import {
  collectBuyAmount,
  collectBuyListings,
  collectListingKey,
} from "./collect-buy.helpers";
import { isPositiveEthAmount } from "./collect-form.validation";
import {
  collectProfileWallets,
  isCollectProfileWallet,
} from "./collect-recipient.helpers";
import { collectAssetIdentity } from "./collect.adapters";
import type { CollectSelectedListing } from "./collect-selection.helpers";
import type {
  CollectTdhDailyEstimate,
  CollectTdhDailyInput,
} from "./collect-tdh-daily.types";
import type { CollectCollection } from "./collect.types";

function reject(): never {
  throw new Error("COLLECT_DAILY_TDH_MISMATCH");
}
function unsigned(value: string): bigint {
  if (!/^(0|[1-9]\d{0,77})$/.test(value)) return reject();
  const parsed = BigInt(value);
  return parsed < 2n ** 256n ? parsed : reject();
}
const families = (collection: CollectCollection): ApiCollectFamily[] =>
  Object.values(ApiCollectFamily).filter(
    (family) => collection === "all" || family.toString() === collection
  );
const sortedFamilies = (values: readonly ApiCollectFamily[] | undefined) =>
  [...(values ?? [])].sort().join(":");

export function validCollectDailyInput(input: CollectTdhDailyInput): boolean {
  if (!isPositiveEthAmount(input.value)) return false;
  if (input.mode === "budget") return parseEther(input.value) < 2n ** 256n;
  return (
    (input.value.split(".")[1]?.length ?? 0) <= 2 &&
    parseUnits(input.value, 2) <= BigInt(Number.MAX_SAFE_INTEGER)
  );
}

export function collectDailyTdhRequest(
  input: CollectTdhDailyInput,
  profile: ApiIdentity,
  recipient: string,
  collection: CollectCollection
): ApiCollectDailyTdhRequest {
  if (
    !profile.id ||
    !validCollectDailyInput(input) ||
    !isCollectProfileWallet(profile, recipient)
  )
    return reject();
  const common = {
    profile_id: profile.id,
    recipient: getAddress(recipient),
    families: families(collection),
  };
  return input.mode === "daily_tdh"
    ? {
        ...common,
        mode: ApiCollectDailyTdhRequestModeEnum.BaseTdhTarget,
        target_base_tdh_per_day_hundredths: parseUnits(
          input.value,
          2
        ).toString(),
      }
    : {
        ...common,
        mode: ApiCollectDailyTdhRequestModeEnum.EthBudget,
        budget_wei: parseEther(input.value).toString(),
      };
}

function validateItems(
  plan: ApiCollectDailyTdhPlan,
  expected: ApiCollectDailyTdhRequest,
  profile: ApiIdentity,
  now: number
): void {
  let total = 0n,
    fees = 0n;
  const orders = new Set<string>(),
    uniqueAssets = new Set<string>();
  const profileWallets = collectProfileWallets(profile).map(
    (wallet) => wallet.wallet
  );
  for (const item of plan.items) {
    const identity = collectAssetIdentity(item.asset.asset_key);
    const key = collectListingKey(item.order);
    if (
      identity?.family !== item.asset.family ||
      identity.tokenId !== item.asset.token_id ||
      item.asset.chain_id !== 1 ||
      item.asset.asset_key !==
        `1:${item.asset.contract.toLowerCase()}:${item.asset.token_id}` ||
      !(expected.families ?? []).includes(item.asset.family) ||
      item.recipient.toLowerCase() !== expected.recipient.toLowerCase() ||
      orders.has(key) ||
      !/^0x[\da-f]{64}$/i.test(item.order.identity.order_hash) ||
      (item.asset.family !== ApiCollectFamily.Memes &&
        (item.quantity !== "1" || uniqueAssets.has(item.asset.asset_key))) ||
      collectBuyListings({
        orders: [item.order],
        assetKey: item.asset.asset_key,
        quantity: item.quantity,
        profileWallets,
        nowSeconds: now / 1000,
      }).length !== 1
    )
      return reject();
    orders.add(key);
    uniqueAssets.add(item.asset.asset_key);
    const amount = collectBuyAmount(item.order, item.quantity);
    if (amount === null) return reject();
    const quantity = unsigned(item.quantity),
      quoted = unsigned(item.order.quantity);
    let itemFees = 0n;
    for (const fee of item.order.fees)
      itemFees += (unsigned(fee.amount_wei) * quantity) / quoted;
    if (
      (unsigned(item.order.net_wei) * quantity) / quoted + itemFees !==
      unsigned(amount)
    )
      return reject();
    total += unsigned(amount);
    fees += itemFees;
  }
  if (
    total !== unsigned(plan.purchase_cost_wei) ||
    fees !== unsigned(plan.signed_fees_wei) ||
    fees > total
  )
    return reject();
  if (
    expected.budget_wei !== undefined &&
    (total > unsigned(expected.budget_wei) ||
      plan.remaining_budget_wei !==
        (unsigned(expected.budget_wei) - total).toString())
  )
    return reject();
  if (expected.budget_wei === undefined && plan.remaining_budget_wei !== null)
    return reject();
}

function validateRequest(
  plan: ApiCollectDailyTdhPlan,
  expected: ApiCollectDailyTdhRequest,
  profile: ApiIdentity
): void {
  const actual = plan.request;
  if (
    profile.id !== expected.profile_id ||
    !isCollectProfileWallet(profile, expected.recipient) ||
    actual.profile_id !== expected.profile_id ||
    actual.recipient.toLowerCase() !== expected.recipient.toLowerCase() ||
    actual.mode !== expected.mode ||
    actual.target_base_tdh_per_day_hundredths !==
      expected.target_base_tdh_per_day_hundredths ||
    actual.budget_wei !== expected.budget_wei ||
    sortedFamilies(actual.families) !== sortedFamilies(expected.families) ||
    !Object.values(ApiCollectDailyTdhPlanStatusEnum).includes(plan.status) ||
    plan.items.length > 1000
  )
    return reject();
}

function validateRate(
  plan: ApiCollectDailyTdhPlan,
  expected: ApiCollectDailyTdhRequest,
  now: number
) {
  const rate = unsigned(plan.base_tdh_per_day_hundredths);
  if (expected.target_base_tdh_per_day_hundredths !== undefined) {
    const target = unsigned(expected.target_base_tdh_per_day_hundredths);
    const shortfall = target > rate ? target - rate : 0n;
    if (
      plan.shortfall_base_tdh_per_day_hundredths !== shortfall.toString() ||
      (plan.status === ApiCollectDailyTdhPlanStatusEnum.TargetMetBestFound &&
        shortfall !== 0n)
    )
      return reject();
  } else if (plan.shortfall_base_tdh_per_day_hundredths !== null)
    return reject();
  if (
    (plan.items.length === 0 &&
      (rate !== 0n || plan.purchase_cost_wei !== "0")) ||
    (plan.items.length > 0 &&
      (rate === 0n ||
        !plan.valid_until ||
        !Number.isFinite(Date.parse(plan.valid_until)) ||
        Date.parse(plan.valid_until) <= now)) ||
    (plan.gas_estimate_wei !== null &&
      (plan.items.length > 0 ||
        plan.gas_estimate_wei !== "0" ||
        plan.funding_estimate_wei !== "0")) ||
    (plan.gas_estimate_wei === null && plan.funding_estimate_wei !== null)
  )
    return reject();
}

function validatePersonalEffects(plan: ApiCollectDailyTdhPlan) {
  const rate = unsigned(plan.base_tdh_per_day_hundredths);
  const personal = plan.personal_effects;
  if (
    unsigned(personal.proposed_base_tdh_per_day_hundredths) -
      unsigned(personal.baseline_base_tdh_per_day_hundredths) !==
    rate
  )
    return reject();
  if (
    !personal.counts_toward_profile ||
    !Number.isFinite(personal.baseline_boost) ||
    !Number.isFinite(personal.proposed_boost) ||
    personal.baseline_boost <= 0 ||
    personal.proposed_boost <= 0 ||
    !Number.isFinite(personal.changed_boost_on_existing_tdh)
  )
    return reject();
  for (const value of [
    personal.baseline_base_tdh_per_day_hundredths,
    personal.proposed_base_tdh_per_day_hundredths,
    personal.baseline_boosted_tdh_per_day_ten_thousandths,
    personal.proposed_boosted_tdh_per_day_ten_thousandths,
  ])
    unsigned(value);
  if (
    !/^(0|-?[1-9]\d{0,77})$/.test(
      personal.additional_boosted_tdh_per_day_ten_thousandths
    ) ||
    BigInt(personal.additional_boosted_tdh_per_day_ten_thousandths) !==
      unsigned(personal.proposed_boosted_tdh_per_day_ten_thousandths) -
        unsigned(personal.baseline_boosted_tdh_per_day_ten_thousandths)
  )
    return reject();
}

/** Bind price, destinations and base-rate result to the request before displaying executable choices. */
export function validateCollectDailyTdhPlan(
  plan: ApiCollectDailyTdhPlan,
  expected: ApiCollectDailyTdhRequest,
  profile: ApiIdentity,
  now = Date.now()
): void {
  validateRequest(plan, expected, profile);
  validateItems(plan, expected, profile, now);
  validateRate(plan, expected, now);
  validatePersonalEffects(plan);
}

export function collectDailyTdhEstimate(
  plan: ApiCollectDailyTdhPlan
): CollectTdhDailyEstimate<ApiCollectDailyTdhPlan> {
  return {
    dailyTdh: formatUnits(BigInt(plan.base_tdh_per_day_hundredths), 2),
    purchaseEth: formatEther(BigInt(plan.purchase_cost_wei)),
    payload: plan,
  };
}

export function collectDailyTdhSelection(
  plan: ApiCollectDailyTdhPlan,
  profile: ApiIdentity,
  now = Date.now()
): CollectSelectedListing[] {
  validateCollectDailyTdhPlan(plan, plan.request, profile, now);
  if (plan.items.length === 0) return reject();
  return plan.items.map(({ asset, order, quantity }) => ({
    asset,
    order,
    quantity,
  }));
}
