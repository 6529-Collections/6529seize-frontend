import type { ApiMarketCurrencyBook } from "@/generated/models/ApiMarketCurrencyBook";
import type { ApiMarketDepth } from "@/generated/models/ApiMarketDepth";
import type { ApiMarketOrder } from "@/generated/models/ApiMarketOrder";
import {
  ApiMarketOrderSideEnum,
  ApiMarketOrderScopeEnum,
  ApiMarketOrderApplicabilityEnum,
} from "@/generated/models/ApiMarketOrder";
import type { ConfirmedMarketPurchase } from "@/components/collect/market-activity-store";
import { MARKET_SEAPORT } from "@/components/collect/market-validation";

interface OrderChange {
  readonly original: ApiMarketOrder;
  readonly remaining: bigint;
  readonly removedQuantity: bigint;
}

function integer(value: string | null | undefined): bigint | null {
  return typeof value === "string" && /^(0|[1-9][0-9]{0,77})$/.test(value)
    ? BigInt(value)
    : null;
}

function remainingQuantity(
  order: ApiMarketOrder,
  assetKey: string,
  tokenId: string,
  purchases: readonly ConfirmedMarketPurchase[]
): bigint | null {
  const available = integer(order.remaining_quantity);
  if (
    available === null ||
    order.side !== ApiMarketOrderSideEnum.Ask ||
    order.scope !== ApiMarketOrderScopeEnum.Token ||
    order.token_id !== tokenId ||
    order.protocol.toLowerCase() !== MARKET_SEAPORT
  )
    return null;
  let remaining = available;
  for (const purchase of purchases) {
    if (
      purchase.assetKey.toLowerCase() !== assetKey ||
      purchase.protocolAddress.toLowerCase() !== MARKET_SEAPORT ||
      purchase.orderHash.toLowerCase() !== order.order_id.toLowerCase()
    )
      continue;
    const cap = integer(purchase.remainingQuantity);
    if (cap !== null && cap < remaining) remaining = cap;
  }
  return remaining < available ? remaining : null;
}

function updateBook(
  book: ApiMarketCurrencyBook,
  changes: readonly OrderChange[]
): ApiMarketCurrencyBook {
  const relevant = changes.filter(
    ({ original }) =>
      original.currency.address.toLowerCase() ===
        book.currency.address.toLowerCase() &&
      original.currency.decimals === book.currency.decimals &&
      original.unit_price !== null &&
      original.applicability !==
        ApiMarketOrderApplicabilityEnum.CriteriaUnverified
  );
  if (relevant.length === 0) return book;
  let cumulative = 0n;
  let removedOrders = 0;
  const asks = book.asks.flatMap((level) => {
    const previous = integer(level.quantity);
    if (previous === null) return [level];
    const matched = relevant.filter(
      ({ original }) => original.unit_price === level.unit_price
    );
    const removed = matched.reduce(
      (sum, change) => sum + change.removedQuantity,
      0n
    );
    const count = matched.filter((change) => change.remaining === 0n).length;
    const quantity = previous > removed ? previous - removed : 0n;
    removedOrders += count;
    if (quantity === 0n) return [];
    cumulative += quantity;
    return [
      {
        ...level,
        quantity: quantity.toString(),
        cumulative_quantity: cumulative.toString(),
        order_count: Math.max(0, level.order_count - count),
      },
    ];
  });
  return {
    ...book,
    asks,
    best_ask: asks[0]?.unit_price ?? null,
    ask_order_count: Math.max(0, book.ask_order_count - removedOrders),
  };
}

/**
 * Project safe receipt evidence over a book snapshot without mutating it. The
 * caller must keep the original snapshot for cursor/snapshot validation.
 */
export function reconcileMarketDepthPurchases(
  data: ApiMarketDepth,
  purchases: readonly ConfirmedMarketPurchase[]
): ApiMarketDepth {
  if (purchases.length === 0) return data;
  const assetKey = `1:${data.contract.toLowerCase()}:${data.token_id}`;
  const changes: OrderChange[] = [];
  const orders = data.orders.flatMap((order) => {
    const remaining = remainingQuantity(
      order,
      assetKey,
      data.token_id,
      purchases
    );
    if (remaining === null) return [order];
    changes.push({
      original: order,
      remaining,
      removedQuantity: BigInt(order.remaining_quantity!) - remaining,
    });
    return remaining === 0n
      ? []
      : [{ ...order, remaining_quantity: remaining.toString() }];
  });
  if (changes.length === 0) return data;
  return {
    ...data,
    orders,
    books: data.books.map((book) => updateBook(book, changes)),
    order_count: Math.max(
      0,
      data.order_count -
        changes.filter((change) => change.remaining === 0n).length
    ),
  };
}
