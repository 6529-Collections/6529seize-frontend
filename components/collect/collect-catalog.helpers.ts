import {
  collectBuyAmount,
  collectBuyListings,
  collectListingKey,
  collectOrderPurchaseQuantity,
} from "./collect-buy.helpers";
import type { CollectCatalogEntry } from "./useCollectCatalog";

/** One artwork per row; retain each selected seller's complete order identity. */
export function collectLowestArtworkEntries(
  entries: readonly CollectCatalogEntry[],
  profileWallets: readonly string[],
  nowSeconds: number
): CollectCatalogEntry[] {
  const groups = new Map<string, CollectCatalogEntry[]>();
  for (const entry of entries) {
    const group = groups.get(entry.asset.asset_key) ?? [];
    group.push(entry);
    groups.set(entry.asset.asset_key, group);
  }
  return [...groups.entries()]
    .flatMap(([assetKey, group]) => {
      const order = collectBuyListings({
        orders: group.flatMap((entry) => (entry.order ? [entry.order] : [])),
        assetKey,
        profileWallets,
        nowSeconds,
      })[0];
      if (!order) return [];
      const entry = group.find(
        (item) =>
          item.order &&
          collectListingKey(item.order) === collectListingKey(order)
      );
      const quantity = collectOrderPurchaseQuantity(order);
      const amount =
        quantity === null ? null : collectBuyAmount(order, quantity);
      return entry && amount !== null
        ? [{ entry, amount: BigInt(amount) }]
        : [];
    })
    .sort((left, right) => {
      if (left.amount !== right.amount)
        return left.amount < right.amount ? -1 : 1;
      return left.entry.asset.asset_key.localeCompare(
        right.entry.asset.asset_key
      );
    })
    .map(({ entry }) => entry);
}
