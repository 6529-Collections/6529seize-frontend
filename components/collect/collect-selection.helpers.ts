import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import {
  collectBuyAmount,
  collectBuyListings,
  collectListingKey,
  collectOrderPurchaseQuantity,
} from "./collect-buy.helpers";

export interface CollectSelectedListing {
  readonly asset: ApiCollectAsset;
  readonly order: ApiMarketTradeOrder;
  readonly quantity: string;
}

/** A selection is an exact listing snapshot, never an instruction to substitute. */
export function collectSelectionItem(options: {
  readonly asset: ApiCollectAsset;
  readonly order: ApiMarketTradeOrder;
  readonly profileWallets: readonly string[];
  readonly nowSeconds: number;
}): CollectSelectedListing | null {
  const { asset, order } = options;
  const quantity = collectOrderPurchaseQuantity(order);
  if (quantity === null) return null;
  if (asset.family !== ApiCollectFamily.Memes && quantity !== "1") return null;
  const eligible = collectBuyListings({
    ...options,
    orders: [order],
    assetKey: asset.asset_key,
    quantity,
  });
  return eligible.length === 1 ? { asset, order, quantity } : null;
}

export function toggleCollectSelection(
  selected: readonly CollectSelectedListing[],
  item: CollectSelectedListing
): CollectSelectedListing[] {
  const key = collectListingKey(item.order);
  if (selected.some((entry) => collectListingKey(entry.order) === key))
    return selected.filter((entry) => collectListingKey(entry.order) !== key);
  // An ERC721 can only be bought once. Different listings of editions stay distinct.
  if (
    item.asset.family !== ApiCollectFamily.Memes &&
    selected.some((entry) => entry.asset.asset_key === item.asset.asset_key)
  )
    return [...selected];
  return [...selected, item];
}

export function collectSelectionTotal(
  items: readonly CollectSelectedListing[]
): string | null {
  let total = 0n;
  for (const item of items) {
    const amount = collectBuyAmount(item.order, item.quantity);
    if (amount === null) return null;
    total += BigInt(amount);
  }
  return total.toString();
}
