import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiCollectPlanLeg } from "@/generated/models/ApiCollectPlanLeg";
import { fetchCollectAssets } from "@/services/api/collect-api";
import { fetchMarketOrders } from "@/services/api/market-api";
import { collectAssetIdentity } from "./collect.adapters";
import { collectBuyAmount, collectBuyListings } from "./collect-buy.helpers";
import type { CollectSelectedListing } from "./collect-selection.helpers";
import { MARKET_BATCH_LIMITS } from "./market-batch-validation";
import { MARKET_SEAPORT } from "./market-validation";

const MAX_ASSET_PAGES = 100;
const CONCURRENT_LOOKUPS = 4;
const UINT256_MAX = (1n << 256n) - 1n;

function amount(value: string): bigint | null {
  if (!/^(0|[1-9][0-9]{0,77})$/.test(value)) return null;
  const parsed = BigInt(value);
  return parsed <= UINT256_MAX ? parsed : null;
}

export function collectPlanLegCost(leg: ApiCollectPlanLeg): string | null {
  const copies = amount(leg.quantity);
  const unit =
    leg.unit_price_wei === undefined ? null : amount(leg.unit_price_wei);
  if (copies === null || copies === 0n || unit === null || unit === 0n)
    return null;
  const total = copies * unit;
  return total <= UINT256_MAX ? total.toString() : null;
}

export function collectPlanSelectionCost(
  legs: readonly ApiCollectPlanLeg[]
): string | null {
  let total = 0n;
  for (const leg of legs) {
    const cost = collectPlanLegCost(leg);
    if (cost === null) return null;
    total += BigInt(cost);
  }
  return total <= UINT256_MAX ? total.toString() : null;
}

async function findPlanAsset(
  assetKey: string,
  signal: AbortSignal
): Promise<ApiCollectAsset> {
  const identity = collectAssetIdentity(assetKey);
  if (!identity || assetKey.split(":").length !== 3)
    throw new Error("UNSUPPORTED_ASSET");
  const seen = new Set<string>();
  for (let page = 1; page <= MAX_ASSET_PAGES; page++) {
    signal.throwIfAborted();
    const response = await fetchCollectAssets({
      family: identity.family,
      query: identity.tokenId,
      page,
      signal,
    });
    signal.throwIfAborted();
    if (response.page !== page) throw new Error("ASSET_SEARCH_INCOMPLETE");
    const asset = response.data.find((item) => item.asset_key === assetKey);
    if (asset) {
      if (
        asset.chain_id !== 1 ||
        asset.family !== identity.family ||
        `1:${asset.contract.toLowerCase()}:${asset.token_id}` !== assetKey
      )
        throw new Error("UNSUPPORTED_ASSET");
      return asset;
    }
    const previousSize = seen.size;
    for (const item of response.data) {
      seen.add(item.asset_key);
    }
    if (!response.next || previousSize === seen.size) break;
  }
  throw new Error("ASSET_SEARCH_INCOMPLETE");
}

async function resolveLeg(
  leg: ApiCollectPlanLeg,
  profileWallets: readonly string[],
  signal: AbortSignal
): Promise<CollectSelectedListing> {
  const asset = await findPlanAsset(leg.asset_key, signal);
  if (asset.family !== ApiCollectFamily.Memes && leg.quantity !== "1")
    throw new Error("ORDER_GONE");
  signal.throwIfAborted();
  const response = await fetchMarketOrders(leg.asset_key, "LISTING", signal);
  signal.throwIfAborted();
  const exact = response.orders.filter(
    (order) =>
      order.identity.order_hash.toLowerCase() === leg.order_id.toLowerCase() &&
      order.identity.protocol_address.toLowerCase() === MARKET_SEAPORT
  );
  const order = exact[0];
  if (
    exact.length !== 1 ||
    !order ||
    collectBuyListings({
      orders: exact,
      assetKey: leg.asset_key,
      quantity: leg.quantity,
      profileWallets,
      nowSeconds: Date.now() / 1000,
    }).length !== 1
  )
    throw new Error("ORDER_GONE");
  const exactCost = collectBuyAmount(order, leg.quantity);
  if (exactCost === null) throw new Error("ORDER_GONE");
  if (leg.unit_price_wei !== undefined && collectPlanLegCost(leg) !== exactCost)
    throw new Error("PLAN_PRICE_CHANGED");
  return { asset, order, quantity: leg.quantity };
}

/** Resolve only selected identities; do not replace missing listings or silently split a plan. */
export async function resolveCollectPlanSelection(
  legs: readonly ApiCollectPlanLeg[],
  profileWallets: readonly string[],
  signal: AbortSignal
): Promise<CollectSelectedListing[]> {
  if (!legs.length || legs.length > MARKET_BATCH_LIMITS.orders)
    throw new Error("PLAN_SELECTION_LIMIT");
  const hashes = new Set<string>();
  for (const leg of legs) {
    if (
      !/^0x[0-9a-fA-F]{64}$/.test(leg.order_id) ||
      hashes.has(leg.order_id.toLowerCase())
    )
      throw new Error("ORDER_GONE");
    hashes.add(leg.order_id.toLowerCase());
  }
  const results = new Array<CollectSelectedListing>(legs.length);
  let next = 0;
  let failed = false;
  async function worker() {
    while (!failed && next < legs.length) {
      signal.throwIfAborted();
      const index = next++;
      try {
        results[index] = await resolveLeg(legs[index]!, profileWallets, signal);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(legs.length, CONCURRENT_LOOKUPS) }, worker)
  );
  signal.throwIfAborted();
  return results;
}
