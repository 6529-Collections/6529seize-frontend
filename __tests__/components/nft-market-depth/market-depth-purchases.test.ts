import { reconcileMarketDepthPurchases } from "@/components/nft-market-depth/market-depth-purchases";
import type { ConfirmedMarketPurchase } from "@/components/collect/market-activity-store";
import {
  MARKET_SEAPORT,
  MARKET_ZERO,
} from "@/components/collect/market-validation";
import {
  ApiMarketDepthStatusEnum,
  type ApiMarketDepth,
} from "@/generated/models/ApiMarketDepth";
import {
  ApiMarketOrderApplicabilityEnum,
  ApiMarketOrderScopeEnum,
  ApiMarketOrderSideEnum,
  type ApiMarketOrder,
} from "@/generated/models/ApiMarketOrder";

const contract = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
const currency = { address: MARKET_ZERO, symbol: "ETH", decimals: 18 };
function order(hash: string, price = "1"): ApiMarketOrder {
  return {
    order_key: hash,
    order_id: `0x${hash.repeat(64)}`,
    source: "opensea",
    protocol: MARKET_SEAPORT,
    collection_slug: "memes",
    side: ApiMarketOrderSideEnum.Ask,
    scope: ApiMarketOrderScopeEnum.Token,
    maker: `0x${"1".repeat(40)}`,
    token_id: "7",
    original_quantity: "4",
    remaining_quantity: "4",
    currency,
    total_price_raw: "4000000000000000000",
    unit_price: price,
    starts_at: null,
    expires_at: null,
    observed_at: new Date(),
    applicability: ApiMarketOrderApplicabilityEnum.Token,
    liquidity_group: hash,
    caveats: [],
  };
}
function depth(): ApiMarketDepth {
  return {
    contract,
    token_id: "7",
    status: ApiMarketDepthStatusEnum.Fresh,
    as_of: null,
    snapshots: [],
    orders: [order("a"), order("b"), order("c", "2")],
    order_count: 3,
    next: "more-orders",
    criteria_order_count: 0,
    notes: [],
    books: [
      {
        currency,
        asks: [
          {
            unit_price: "1",
            quantity: "8",
            cumulative_quantity: "8",
            order_count: 2,
          },
          {
            unit_price: "2",
            quantity: "4",
            cumulative_quantity: "12",
            order_count: 1,
          },
        ],
        bids: [],
        best_ask: "1",
        best_bid: null,
        ask_order_count: 3,
        bid_order_count: 0,
      },
    ],
  };
}
function purchase(
  overrides: Partial<ConfirmedMarketPurchase> = {}
): ConfirmedMarketPurchase {
  return {
    operationId: "confirmed",
    profileId: "profile",
    assetKey: `1:${contract}:7`,
    protocolAddress: MARKET_SEAPORT,
    orderHash: order("a").order_id,
    quantity: "4",
    remainingQuantity: "0",
    confirmedAt: Date.now(),
    ...overrides,
  };
}

it("removes an exact consumed order, retaining its other seller and updating level/count totals", () => {
  const original = depth();
  const projected = reconcileMarketDepthPurchases(original, [purchase()]);
  expect(projected.orders).toEqual(original.orders.slice(1));
  expect(projected.order_count).toBe(2);
  expect(projected.books[0]).toMatchObject({
    ask_order_count: 2,
    best_ask: "1",
    asks: [
      { quantity: "4", cumulative_quantity: "4", order_count: 1 },
      { quantity: "4", cumulative_quantity: "8", order_count: 1 },
    ],
  });
  expect(projected.next).toBe("more-orders");
  expect(original.order_count).toBe(3);
  expect(original.books[0]?.asks[0]?.quantity).toBe("8");
});

it("caps a partial fill once and preserves the original signed advertised price", () => {
  const original = depth();
  const fills = [purchase({ quantity: "2", remainingQuantity: "2" })];
  const projected = reconcileMarketDepthPurchases(original, fills);
  expect(projected.orders[0]).toEqual({
    ...original.orders[0],
    remaining_quantity: "2",
  });
  expect(projected.order_count).toBe(3);
  expect(projected.books[0]?.asks[0]).toMatchObject({
    quantity: "6",
    cumulative_quantity: "6",
    order_count: 2,
  });
  expect(projected.books[0]?.asks[1]?.cumulative_quantity).toBe("10");
  expect(reconcileMarketDepthPurchases(projected, fills)).toBe(projected);
});

it("advances the best ask when a whole level is consumed", () => {
  const projected = reconcileMarketDepthPurchases(depth(), [
    purchase(),
    purchase({ operationId: "second", orderHash: order("b").order_id }),
  ]);
  expect(projected.books[0]).toMatchObject({
    best_ask: "2",
    ask_order_count: 1,
    asks: [{ unit_price: "2", quantity: "4", cumulative_quantity: "4" }],
  });
});

it.each([
  { assetKey: `1:${contract}:8` },
  { protocolAddress: `0x${"9".repeat(40)}` },
  { orderHash: order("d").order_id },
  { remainingQuantity: "4" },
])(
  "keeps unmatched or already reconciled evidence unchanged: %j",
  (override) => {
    const original = depth();
    expect(reconcileMarketDepthPurchases(original, [purchase(override)])).toBe(
      original
    );
  }
);

it("does not apply an ask fill to a bid or an unidentified protocol", () => {
  const original = depth();
  original.orders[0] = {
    ...original.orders[0]!,
    side: ApiMarketOrderSideEnum.Bid,
  };
  expect(reconcileMarketDepthPurchases(original, [purchase()])).toBe(original);
  original.orders[0] = {
    ...original.orders[0]!,
    side: ApiMarketOrderSideEnum.Ask,
    protocol: "seaport",
  };
  expect(reconcileMarketDepthPurchases(original, [purchase()])).toBe(original);
});
