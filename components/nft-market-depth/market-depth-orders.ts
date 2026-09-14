import type { ApiMarketCurrency } from "@/generated/models/ApiMarketCurrency";
import type { ApiMarketDepth } from "@/generated/models/ApiMarketDepth";
import {
  ApiMarketOrderApplicabilityEnum,
  ApiMarketOrderSideEnum,
  type ApiMarketOrder,
} from "@/generated/models/ApiMarketOrder";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";

type MarketSide = "ask" | "bid";

const API_SIDE_BY_MARKET_SIDE: Record<MarketSide, ApiMarketOrderSideEnum> = {
  ask: ApiMarketOrderSideEnum.Ask,
  bid: ApiMarketOrderSideEnum.Bid,
};

export class MarketDepthSnapshotChangedError extends Error {
  constructor(message = "The market depth snapshot changed while loading.") {
    super(message);
    this.name = "MarketDepthSnapshotChangedError";
  }
}

function currencyMatches(
  left: ApiMarketCurrency,
  right: ApiMarketCurrency
): boolean {
  return (
    left.address.toLowerCase() === right.address.toLowerCase() &&
    left.decimals === right.decimals
  );
}

function isLevelOrder(order: ApiMarketOrder): boolean {
  return (
    order.applicability !==
      ApiMarketOrderApplicabilityEnum.CriteriaUnverified &&
    order.unit_price !== null &&
    order.remaining_quantity !== null
  );
}

function getSnapshotIds(data: ApiMarketDepth): string {
  return JSON.stringify(
    data.snapshots
      .map(({ id }) => id)
      .sort((left, right) => {
        if (left === right) return 0;
        return left < right ? -1 : 1;
      })
  );
}

function getAsOfTime(data: ApiMarketDepth): number | null {
  return data.as_of === null ? null : new Date(data.as_of).getTime();
}

function assertSameSnapshot(
  initial: ApiMarketDepth,
  page: ApiMarketDepth
): void {
  const isSame =
    page.contract === initial.contract &&
    page.token_id === initial.token_id &&
    getSnapshotIds(page) === getSnapshotIds(initial) &&
    Object.is(getAsOfTime(page), getAsOfTime(initial)) &&
    page.order_count === initial.order_count &&
    page.criteria_order_count === initial.criteria_order_count &&
    JSON.stringify(page.books) === JSON.stringify(initial.books);

  if (!isSame) {
    throw new MarketDepthSnapshotChangedError();
  }
}

function addOrders(
  target: ApiMarketOrder[],
  orderKeys: Set<string>,
  orders: readonly ApiMarketOrder[]
): void {
  for (const order of orders) {
    if (orderKeys.has(order.order_key)) {
      throw new MarketDepthSnapshotChangedError(
        "The market depth pages contained a duplicate order."
      );
    }
    orderKeys.add(order.order_key);
    target.push(order);
  }
}

function assertOrderCountProgress(
  loadedCount: number,
  expectedCount: number,
  next: string | null
): void {
  if (
    loadedCount > expectedCount ||
    (loadedCount === expectedCount && next !== null)
  ) {
    throw new MarketDepthSnapshotChangedError();
  }
}

function markCursorSeen(cursor: string, seenCursors: Set<string>): void {
  if (seenCursors.has(cursor)) {
    throw new MarketDepthSnapshotChangedError(
      "The market depth cursor did not advance."
    );
  }
  seenCursors.add(cursor);
}

async function loadNextPage(
  cursor: string,
  loadPage: (cursor: string, signal: AbortSignal) => Promise<ApiMarketDepth>,
  signal: AbortSignal
): Promise<ApiMarketDepth> {
  try {
    return await loadPage(cursor, signal);
  } catch (error) {
    if (getStructuredApiErrorStatus(error) === 400) {
      throw new MarketDepthSnapshotChangedError();
    }
    throw error;
  }
}

export async function loadCompleteMarketDepth(
  initial: ApiMarketDepth,
  loadPage: (cursor: string, signal: AbortSignal) => Promise<ApiMarketDepth>,
  signal: AbortSignal
): Promise<ApiMarketDepth> {
  signal.throwIfAborted();

  const orders: ApiMarketOrder[] = [];
  const orderKeys = new Set<string>();
  addOrders(orders, orderKeys, initial.orders);
  assertOrderCountProgress(orders.length, initial.order_count, initial.next);

  const seenCursors = new Set<string>();
  let cursor = initial.next;

  while (cursor !== null) {
    signal.throwIfAborted();
    markCursorSeen(cursor, seenCursors);
    const page = await loadNextPage(cursor, loadPage, signal);

    signal.throwIfAborted();
    assertSameSnapshot(initial, page);
    if (page.orders.length === 0 && page.next !== null) {
      throw new MarketDepthSnapshotChangedError(
        "The market depth cursor did not make progress."
      );
    }
    addOrders(orders, orderKeys, page.orders);
    assertOrderCountProgress(orders.length, initial.order_count, page.next);
    cursor = page.next;
  }

  if (orders.length !== initial.order_count) {
    throw new MarketDepthSnapshotChangedError(
      "The market depth pages did not contain the advertised order count."
    );
  }

  return {
    ...initial,
    orders,
    next: null,
  };
}

export function getLevelOrders(
  orders: readonly ApiMarketOrder[],
  currency: ApiMarketCurrency,
  side: MarketSide,
  unitPrice: string
): ApiMarketOrder[] {
  const apiSide = API_SIDE_BY_MARKET_SIDE[side];
  return orders.filter(
    (order) =>
      order.side === apiSide &&
      isLevelOrder(order) &&
      order.unit_price === unitPrice &&
      currencyMatches(order.currency, currency)
  );
}

function belongsToBookLevel(
  data: ApiMarketDepth,
  order: ApiMarketOrder
): boolean {
  if (!isLevelOrder(order)) return false;

  const book = data.books.find(({ currency }) =>
    currencyMatches(order.currency, currency)
  );
  if (!book) return false;

  const levels =
    order.side === ApiMarketOrderSideEnum.Ask ? book.asks : book.bids;
  return levels.some(({ unit_price }) => unit_price === order.unit_price);
}

export function getOtherOrders(data: ApiMarketDepth): ApiMarketOrder[] {
  return data.orders.filter((order) => !belongsToBookLevel(data, order));
}

export function getOtherOrderCount(data: ApiMarketDepth): number {
  const levelOrderCount = data.books.reduce(
    (bookTotal, book) =>
      bookTotal +
      [...book.asks, ...book.bids].reduce(
        (levelTotal, level) => levelTotal + level.order_count,
        0
      ),
    0
  );
  return Math.max(0, data.order_count - levelOrderCount);
}
