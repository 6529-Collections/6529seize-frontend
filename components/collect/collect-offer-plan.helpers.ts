import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import { formatEther, parseEther } from "viem";
import { isPositiveEthAmount } from "./collect-form.validation";
import { collectProfileWallets } from "./collect-recipient.helpers";
import { collectAssetIdentity } from "./collect.adapters";
import type {
  CollectOfferSelection,
  OfferPlanPrice,
  OfferPlanRow,
  OfferPriceMethod,
  OfferPricingControls,
  PublishedOfferCommitment,
} from "./collect-offer-plan.types";

const UINT_MAX = 2n ** 256n - 1n;
export const OFFER_EXPIRY_HOURS = ["24", "168", "720"] as const;

function offerSelectionKey(row: CollectOfferSelection): string {
  return row.assetKey ?? row.asset?.asset_key ?? "";
}

export function offerUnitWei(value: string): bigint | null {
  if (!isPositiveEthAmount(value)) return null;
  const amount = parseEther(value);
  return amount > 0n && amount <= UINT_MAX ? amount : null;
}

export function offerQuantity(row: CollectOfferSelection): bigint | null {
  if (!/^[1-9]\d{0,2}$/.test(row.quantity)) return null;
  const identity = collectAssetIdentity(offerSelectionKey(row));
  if (
    !identity ||
    (row.asset && row.asset.asset_key !== offerSelectionKey(row))
  )
    return null;
  const quantity = BigInt(row.quantity);
  const maximum = identity.family === ApiCollectFamily.Memes ? 100n : 1n;
  return quantity <= maximum ? quantity : null;
}

export function offerRowTotal(row: OfferPlanRow): bigint | null {
  const unit = offerUnitWei(row.unitPriceEth);
  const quantity = offerQuantity(row);
  if (unit === null || quantity === null) return null;
  const total = unit * quantity;
  return total <= UINT_MAX ? total : null;
}

export function offerRowIssue(row: OfferPlanRow) {
  if (offerQuantity(row) === null) return "quantity";
  if (offerRowTotal(row) === null) return "price";
  if (!OFFER_EXPIRY_HOURS.some((hours) => hours === row.expiryHours))
    return "expiry";
  return null;
}

/** Basis points are exact decimal percentages; no floating-point money calculations. */
export function offerBasisPoints(
  value: string,
  method: OfferPriceMethod
): number | null {
  if (value.length > 7) return null;
  const [whole = "", fraction = ""] = value.split(".");
  if (
    !/^(0|[1-9]\d{0,3})$/.test(whole) ||
    !/^\d{0,2}$/.test(fraction) ||
    value.split(".").length > 2 ||
    value.endsWith(".")
  )
    return null;
  const points = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (method === "discount_ask") return points < 10000 ? points : null;
  return points <= 100000 ? points : null;
}

export function initialOfferRows(
  items: readonly CollectOfferSelection[]
): OfferPlanRow[] {
  const rows = new Map<string, OfferPlanRow>();
  for (const item of items) {
    const assetKey = offerSelectionKey(item);
    const prior = rows.get(assetKey);
    if (prior) {
      const previousQuantity = offerQuantity(prior);
      const nextQuantity = offerQuantity(item);
      // Multiple selected listings of the same NFT become one explicit offer quantity.
      rows.set(assetKey, {
        ...prior,
        quantity:
          previousQuantity !== null && nextQuantity !== null
            ? (previousQuantity + nextQuantity).toString()
            : "",
      });
    } else {
      rows.set(assetKey, {
        asset: item.asset,
        assetKey,
        quantity: item.quantity,
        selected: true,
        unitPriceEth: "",
        expiryHours: "168",
        pinned: false,
      });
    }
  }
  return [...rows.values()];
}

/** Missing recommendations clear old generated prices; explicit manual pins never change. */
export function applyOfferPrices(
  rows: readonly OfferPlanRow[],
  prices: readonly OfferPlanPrice[],
  method: OfferPriceMethod
): OfferPlanRow[] {
  const byAsset = new Map(prices.map((price) => [price.assetKey, price]));
  return rows.map((row) => {
    const price = byAsset.get(row.assetKey);
    const asset =
      price?.asset?.asset_key === row.assetKey ? price.asset : row.asset;
    if (row.pinned || !row.selected) return { ...row, asset };
    const amount = price?.unitAmountWei;
    if (price?.quantity !== row.quantity || amount === null || !amount)
      return { ...row, asset, unitPriceEth: "" };
    if (!/^[1-9]\d{0,77}$/.test(amount) || BigInt(amount) > UINT_MAX)
      return { ...row, asset, unitPriceEth: "" };
    return {
      ...row,
      asset,
      unitPriceEth: formatEther(BigInt(amount)),
      selected: method === "goal" ? price.selected : row.selected,
    };
  });
}

export function offerAnalysisIssue(
  rows: readonly OfferPlanRow[],
  controls: OfferPricingControls,
  unknownPublished: boolean
) {
  if (!rows.length) return "collect.offerPlan.selectSome";
  if (rows.some((row) => offerQuantity(row) === null))
    return "collect.offerPlan.invalid.quantity";
  if (
    controls.method === "improve_bid" &&
    offerBasisPoints(controls.percent, controls.method) === null
  )
    return "collect.offerPlan.invalid.improvement";
  if (
    controls.method === "discount_ask" &&
    offerBasisPoints(controls.percent, controls.method) === null
  )
    return "collect.offerPlan.invalid.discount";
  if (controls.method === "goal" && offerUnitWei(controls.budgetEth) === null)
    return "collect.offerPlan.invalid.budget";
  if (controls.method === "goal" && unknownPublished)
    return "collect.offerPlan.publishedUnknown";
  if (
    rows.some(
      (row) =>
        (controls.method === "manual" || row.pinned) &&
        offerRowIssue(row) !== null
    )
  )
    return "collect.offerPlan.enterEachPrice";
  return null;
}

export function offerPlanTotals(
  rows: readonly OfferPlanRow[],
  published: readonly string[]
) {
  let amount = 0n;
  let priced = 0;
  let unresolved = 0;
  for (const row of rows) {
    if (!row.selected || published.includes(row.assetKey)) continue;
    const total = offerRowTotal(row);
    if (total === null) unresolved++;
    else {
      amount += total;
      priced++;
    }
  }
  return { amount, priced, unresolved };
}

export function offerPublishedTotal(
  offers: readonly PublishedOfferCommitment[]
): bigint | null {
  let total = 0n;
  for (const offer of offers) {
    if (!/^[1-9]\d{0,77}$/.test(offer.amountWei)) return null;
    total += BigInt(offer.amountWei);
    if (total > UINT_MAX) return null;
  }
  return total;
}

/** Profile/member/payer and exact selected quantities form one private planning scope. */
export function offerPlanScope(
  items: readonly CollectOfferSelection[],
  profile: ApiIdentity | null,
  payingWallet: string | undefined
): string {
  return JSON.stringify({
    profile: profile?.id,
    wallets: collectProfileWallets(profile)
      .map((item) => item.wallet.toLowerCase())
      .sort((a, b) => a.localeCompare(b)),
    payer: payingWallet?.toLowerCase(),
    items: items.map((item) => [offerSelectionKey(item), item.quantity]),
  });
}
