import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiCollectAnalysis } from "@/generated/models/ApiCollectAnalysis";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import {
  ApiMarketOrderApplicabilityEnum,
  ApiMarketOrderScopeEnum,
  ApiMarketOrderSideEnum,
  type ApiMarketOrder,
} from "@/generated/models/ApiMarketOrder";
import {
  ApiMarketTradeOrderSideEnum,
  type ApiMarketTradeOrder,
} from "@/generated/models/ApiMarketTradeOrder";
import {
  GRADIENT_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";
import { fetchCollectAssets } from "@/services/api/collect-api";
import {
  collectBuyAmount,
  collectBuyListings,
  collectOrderAvailableQuantity,
  collectOrderQuantityStep,
} from "@/components/collect/collect-buy.helpers";
import {
  MARKET_SEAPORT,
  MARKET_WETH,
  MARKET_ZERO,
} from "@/components/collect/market-validation";

const MAX_ASSET_LOOKUP_PAGES = 100;
const UINT = /^(0|[1-9][0-9]{0,77})$/;
const UINT256_MAX = (1n << 256n) - 1n;

function uint256(value: string): bigint | null {
  if (!UINT.test(value)) return null;
  const amount = BigInt(value);
  return amount <= UINT256_MAX ? amount : null;
}

export interface MarketDepthListingSelection {
  readonly asset: ApiCollectAsset;
  readonly depthOrder: ApiMarketOrder;
  readonly order: ApiMarketTradeOrder;
  readonly quantity: string;
}

type MarketDepthTradeMatch =
  | { readonly order: ApiMarketTradeOrder; readonly reason?: never }
  | { readonly order?: never; readonly reason: "changed" | "unsupported" };

const same = (left: string, right: string) =>
  left.toLowerCase() === right.toLowerCase();

function activeTimestamp(value: string, nowSeconds: number): boolean {
  if (!UINT.test(value) || !Number.isFinite(nowSeconds)) return false;
  return BigInt(value) <= BigInt(Math.floor(nowSeconds));
}

function futureTimestamp(value: string, nowSeconds: number): boolean {
  if (!UINT.test(value) || !Number.isFinite(nowSeconds)) return false;
  return BigInt(value) > BigInt(Math.floor(nowSeconds));
}

function depthTimeMatches(value: Date | null, seconds: string): boolean {
  if (value === null) return true;
  const milliseconds = new Date(value).getTime();
  return (
    Number.isFinite(milliseconds) &&
    BigInt(Math.floor(milliseconds / 1000)) === BigInt(seconds)
  );
}

export function marketDepthCollectFamily(
  contract: string
): ApiCollectFamily | null {
  const families: Readonly<Record<string, ApiCollectFamily>> = {
    [MEMES_CONTRACT.toLowerCase()]: ApiCollectFamily.Memes,
    [GRADIENT_CONTRACT.toLowerCase()]: ApiCollectFamily.Gradients,
    [NEXTGEN_CONTRACT.toLowerCase()]: ApiCollectFamily.Pebbles,
  };
  return families[contract.toLowerCase()] ?? null;
}

function exactAsset(
  asset: ApiCollectAsset,
  family: ApiCollectFamily,
  contract: string,
  tokenId: string
): boolean {
  return (
    asset.family === family &&
    asset.chain_id === 1 &&
    same(asset.contract, contract) &&
    asset.token_id === tokenId &&
    asset.asset_key === `1:${contract.toLowerCase()}:${tokenId}`
  );
}

export async function fetchMarketDepthCollectAsset(
  contract: string,
  tokenId: string,
  signal: AbortSignal
): Promise<ApiCollectAsset> {
  const family = marketDepthCollectFamily(contract);
  if (family === null) throw new Error("MARKET_DEPTH_TRADING_UNSUPPORTED");
  const inspected = new Set<string>();
  for (let page = 1; page <= MAX_ASSET_LOOKUP_PAGES; page++) {
    signal.throwIfAborted();
    const response = await fetchCollectAssets({
      family,
      query: tokenId,
      page,
      signal,
    });
    signal.throwIfAborted();
    const asset = response.data.find((item) =>
      exactAsset(item, family, contract, tokenId)
    );
    if (asset) return asset;
    const previousSize = inspected.size;
    response.data.forEach((item) => inspected.add(item.asset_key));
    if (
      !response.next ||
      inspected.size === previousSize ||
      inspected.size >= response.count
    )
      break;
  }
  throw new Error("MARKET_DEPTH_ASSET_UNAVAILABLE");
}

/**
 * Rebind a display-only depth row to one current executable order. A positive
 * match is useful even when provider discovery is not exhaustive; absence is
 * never interpreted as cancellation or as permission to substitute an order.
 */
export function matchFreshMarketDepthOrder(options: {
  readonly order: ApiMarketTradeOrder;
  readonly depthOrder: ApiMarketOrder;
  readonly assetKey: string;
  readonly side: ApiMarketTradeOrderSideEnum;
  readonly nowSeconds: number;
}): MarketDepthTradeMatch {
  const { order, depthOrder, assetKey, side, nowSeconds } = options;
  if (
    !same(depthOrder.source, "opensea") ||
    !same(depthOrder.protocol, MARKET_SEAPORT) ||
    (side === ApiMarketTradeOrderSideEnum.Listing
      ? depthOrder.side !== ApiMarketOrderSideEnum.Ask
      : depthOrder.side !== ApiMarketOrderSideEnum.Bid)
  )
    return { reason: "unsupported" };
  if (
    order.asset_key !== assetKey ||
    order.side !== side ||
    !same(order.identity.protocol_address, depthOrder.protocol) ||
    !same(order.identity.order_hash, depthOrder.order_id) ||
    !same(order.maker, depthOrder.maker) ||
    !same(order.currency, depthOrder.currency.address) ||
    !activeTimestamp(order.start_time, nowSeconds) ||
    !futureTimestamp(order.end_time, nowSeconds) ||
    !depthTimeMatches(depthOrder.starts_at, order.start_time) ||
    !depthTimeMatches(depthOrder.expires_at, order.end_time)
  )
    return { reason: "changed" };
  return { order };
}

export function marketDepthListingSelection(options: {
  readonly asset: ApiCollectAsset;
  readonly depthOrder: ApiMarketOrder;
  readonly order: ApiMarketTradeOrder;
  readonly quantity: string;
  readonly profileWallets: readonly string[];
  readonly nowSeconds: number;
}): MarketDepthListingSelection | null {
  const { asset, depthOrder, order, quantity, profileWallets, nowSeconds } =
    options;
  if (
    depthOrder.side !== ApiMarketOrderSideEnum.Ask ||
    !same(order.currency, MARKET_ZERO) ||
    (asset.family !== ApiCollectFamily.Memes && quantity !== "1") ||
    collectBuyListings({
      orders: [order],
      assetKey: asset.asset_key,
      quantity,
      profileWallets,
      nowSeconds,
    }).length !== 1
  )
    return null;
  return { asset, depthOrder, order, quantity };
}

export function marketDepthListingQuantityIsValid(
  asset: ApiCollectAsset,
  order: ApiMarketTradeOrder,
  quantity: string
): boolean {
  return (
    (asset.family === ApiCollectFamily.Memes || quantity === "1") &&
    collectBuyAmount(order, quantity) !== null
  );
}

export function marketDepthOfferIsExecutable(options: {
  readonly asset: ApiCollectAsset;
  readonly depthOrder: ApiMarketOrder;
  readonly order: ApiMarketTradeOrder;
  readonly profileWallets: readonly string[];
  readonly nowSeconds: number;
}): boolean {
  const { asset, depthOrder, order, profileWallets, nowSeconds } = options;
  return (
    depthOrder.side === ApiMarketOrderSideEnum.Bid &&
    depthOrder.scope === ApiMarketOrderScopeEnum.Token &&
    depthOrder.applicability === ApiMarketOrderApplicabilityEnum.Token &&
    depthOrder.token_id === asset.token_id &&
    order.asset_key === asset.asset_key &&
    order.side === ApiMarketTradeOrderSideEnum.Offer &&
    same(order.identity.protocol_address, MARKET_SEAPORT) &&
    same(order.currency, MARKET_WETH) &&
    !profileWallets.some((wallet) => same(wallet, order.maker)) &&
    activeTimestamp(order.start_time, nowSeconds) &&
    futureTimestamp(order.end_time, nowSeconds) &&
    collectBuyAmount(order, collectOrderAvailableQuantity(order) ?? "") !== null
  );
}

export function signerOfferQuantityCap(options: {
  readonly analysis: ApiCollectAnalysis;
  readonly profileId: string;
  readonly wallet: string;
  readonly assetKey: string;
  readonly order: ApiMarketTradeOrder;
}): string | null {
  if (options.analysis.account.profile_id !== options.profileId) return null;
  const available = collectOrderAvailableQuantity(options.order);
  const step = collectOrderQuantityStep(options.order);
  if (available === null || step === null) return null;
  const held = signerHoldingQuantity(options);
  if (held === null) return null;
  const maximum = held < BigInt(available) ? held : BigInt(available);
  const increment = BigInt(step);
  const cap = maximum - (maximum % increment);
  return cap > 0n && collectBuyAmount(options.order, cap.toString()) !== null
    ? cap.toString()
    : null;
}

function signerHoldingQuantity(options: {
  readonly analysis: ApiCollectAnalysis;
  readonly wallet: string;
  readonly assetKey: string;
}): bigint | null {
  let held = 0n;
  const holdings = options.analysis.requirements.flatMap(
    (requirement) => requirement.holdings
  );
  for (const holding of holdings) {
    if (
      holding.asset_key !== options.assetKey ||
      !same(holding.wallet, options.wallet)
    )
      continue;
    const quantity = uint256(holding.quantity);
    if (quantity === null) return null;
    if (quantity > held) held = quantity;
  }
  return held;
}

export function marketDepthSelectionConflict(
  selected: readonly MarketDepthListingSelection[],
  candidate: MarketDepthListingSelection
): "duplicate" | "overlap" | null {
  if (
    selected.some(
      (item) =>
        same(
          item.order.identity.protocol_address,
          candidate.order.identity.protocol_address
        ) &&
        same(
          item.order.identity.order_hash,
          candidate.order.identity.order_hash
        )
    )
  )
    return "duplicate";
  if (
    candidate.asset.family !== ApiCollectFamily.Memes &&
    selected.some((item) => item.asset.asset_key === candidate.asset.asset_key)
  )
    return "overlap";
  if (
    selected.some(
      (item) =>
        item.depthOrder.liquidity_group ===
          candidate.depthOrder.liquidity_group ||
        (item.asset.asset_key === candidate.asset.asset_key &&
          same(item.order.maker, candidate.order.maker) &&
          same(item.order.currency, candidate.order.currency))
    )
  )
    return "overlap";
  return null;
}
