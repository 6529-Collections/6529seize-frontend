import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import type { ConfirmedMarketPurchase } from "./market-activity-store";
import type { CollectSelectedListing } from "./collect-selection.helpers";
import {
  collectBuyAmount,
  collectOrderAvailableQuantity,
  collectOrderPurchaseQuantity,
} from "./collect-buy.helpers";

function quantity(value: string | undefined): bigint | null {
  return value !== undefined && /^(0|[1-9][0-9]{0,77})$/.test(value)
    ? BigInt(value)
    : null;
}

export function collectPurchaseMatchesOrder(
  order: ApiMarketTradeOrder,
  purchase: Pick<
    ConfirmedMarketPurchase,
    "assetKey" | "protocolAddress" | "orderHash"
  >
): boolean {
  return (
    order.asset_key.toLowerCase() === purchase.assetKey.toLowerCase() &&
    order.identity.protocol_address.toLowerCase() ===
      purchase.protocolAddress.toLowerCase() &&
    order.identity.order_hash.toLowerCase() === purchase.orderHash.toLowerCase()
  );
}

/**
 * Receipt evidence caps stale discovery; it never subtracts a fill from a fresh
 * indexed quantity a second time, changes signed prices, or hides another order
 * for the same edition. Missing whole-order evidence waits for normal refetch.
 */
export function reconcileCollectOrder(
  order: ApiMarketTradeOrder,
  purchases: readonly ConfirmedMarketPurchase[]
): ApiMarketTradeOrder | null {
  if (purchases.length === 0) return order;
  const available = quantity(collectOrderAvailableQuantity(order) ?? undefined);
  if (available === null) return order;
  let remaining = available;
  for (const purchase of purchases) {
    if (!collectPurchaseMatchesOrder(order, purchase)) continue;
    const limit = quantity(purchase.remainingQuantity);
    if (limit !== null && limit < remaining) remaining = limit;
  }
  if (remaining === 0n) return null;
  if (remaining === available) return order;
  const result = { ...order, available_quantity: remaining.toString() };
  return collectOrderPurchaseQuantity(result) === null ? null : result;
}

/** Apply each confirmed purchase once to the user's exact order selections. */
export function reconcileCollectSelection(
  selected: readonly CollectSelectedListing[],
  purchases: readonly ConfirmedMarketPurchase[]
): CollectSelectedListing[] {
  return selected.flatMap((item) => {
    const selectedQuantity = quantity(item.quantity);
    if (selectedQuantity === null) return [item];
    let fulfilled = 0n;
    const applied = new Set<string>();
    for (const purchase of purchases) {
      if (!collectPurchaseMatchesOrder(item.order, purchase)) continue;
      if (
        item.selectedAt !== undefined &&
        item.selectedAt > purchase.confirmedAt
      )
        continue;
      if (applied.has(purchase.operationId)) continue;
      applied.add(purchase.operationId);
      fulfilled += quantity(purchase.quantity) ?? 0n;
    }
    if (fulfilled === 0n) return [item];
    if (fulfilled >= selectedQuantity) return [];
    const remaining = (selectedQuantity - fulfilled).toString();
    const order = reconcileCollectOrder(item.order, purchases);
    if (!order || collectBuyAmount(order, remaining) === null) return [];
    return [{ ...item, order, quantity: remaining }];
  });
}
