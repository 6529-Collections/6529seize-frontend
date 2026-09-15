import type { ConfirmedMarketPurchase } from "./market-activity-store";

interface CollectPurchaseHistory {
  readonly seen: ReadonlyMap<
    string,
    { profileId: string; confirmedAt: number }
  >;
  readonly discardedThrough: ReadonlyMap<string, number>;
}
export function createCollectPurchaseHistory(): CollectPurchaseHistory {
  return { seen: new Map(), discardedThrough: new Map() };
}
/** Pure and bounded: an abandoned React render cannot consume receipt evidence. */
export function unappliedCollectPurchases(
  history: CollectPurchaseHistory,
  purchases: readonly ConfirmedMarketPurchase[],
  limit = 200 * 128
) {
  const seen = new Map(history.seen);
  const discardedThrough = new Map(history.discardedThrough);
  const unapplied = purchases.filter((purchase) => {
    if (
      purchase.confirmedAt <= (discardedThrough.get(purchase.profileId) ?? -1)
    )
      return false;
    const key = [
      purchase.profileId,
      purchase.operationId,
      purchase.assetKey.toLowerCase(),
      purchase.protocolAddress.toLowerCase(),
      purchase.orderHash.toLowerCase(),
    ].join(":");
    if (seen.has(key)) return false;
    seen.set(key, {
      profileId: purchase.profileId,
      confirmedAt: purchase.confirmedAt,
    });
    return true;
  });
  if (seen.size > limit) {
    const oldest = [...seen].sort(
      ([, left], [, right]) => left.confirmedAt - right.confirmedAt
    );
    for (const [key, purchase] of oldest.slice(0, seen.size - limit)) {
      seen.delete(key);
      discardedThrough.set(
        purchase.profileId,
        Math.max(
          discardedThrough.get(purchase.profileId) ?? -1,
          purchase.confirmedAt
        )
      );
    }
  }
  return { history: { seen, discardedThrough }, unapplied };
}
