import type { ApiMarketCurrency } from "@/generated/models/ApiMarketCurrency";
import {
  ApiMarketDepthStatusEnum,
  type ApiMarketDepth,
} from "@/generated/models/ApiMarketDepth";
import type { ApiMarketCurrencyBook } from "@/generated/models/ApiMarketCurrencyBook";
import {
  ApiMarketOrderApplicabilityEnum,
  ApiMarketOrderScopeEnum,
  ApiMarketOrderSideEnum,
  type ApiMarketOrder,
} from "@/generated/models/ApiMarketOrder";
import {
  getLevelOrders,
  getOtherOrderCount,
  getOtherOrders,
  loadCompleteMarketDepth,
  MarketDepthSnapshotChangedError,
} from "@/components/nft-market-depth/market-depth-orders";

const ETH: ApiMarketCurrency = {
  address: "0x0000000000000000000000000000000000000000",
  symbol: "ETH",
  decimals: 18,
};

const BOOKS: ApiMarketCurrencyBook[] = [
  {
    currency: ETH,
    asks: [
      {
        unit_price: "1.25",
        quantity: "2",
        cumulative_quantity: "2",
        order_count: 1,
      },
    ],
    bids: [
      {
        unit_price: "0.8",
        quantity: "1",
        cumulative_quantity: "1",
        order_count: 1,
      },
    ],
    best_ask: "1.25",
    best_bid: "0.8",
    ask_order_count: 1,
    bid_order_count: 1,
  },
];

function makeOrder(
  orderKey: string,
  overrides: Partial<ApiMarketOrder> = {}
): ApiMarketOrder {
  return {
    order_key: orderKey,
    order_id: orderKey,
    source: "opensea",
    protocol: "seaport",
    collection_slug: "the-memes-by-6529",
    side: ApiMarketOrderSideEnum.Ask,
    scope: ApiMarketOrderScopeEnum.Token,
    maker: "0xmaker",
    token_id: "8",
    original_quantity: "1",
    remaining_quantity: "1",
    currency: ETH,
    total_price_raw: "1250000000000000000",
    unit_price: "1.25",
    starts_at: new Date("2026-09-11T10:00:00.000Z"),
    expires_at: new Date("2026-09-12T10:00:00.000Z"),
    observed_at: new Date("2026-09-11T10:01:00.000Z"),
    applicability: ApiMarketOrderApplicabilityEnum.Token,
    liquidity_group: `maker:${orderKey}`,
    caveats: [],
    ...overrides,
  };
}

function makeDepth(overrides: Partial<ApiMarketDepth> = {}): ApiMarketDepth {
  return {
    contract: "0xcontract",
    token_id: "8",
    status: ApiMarketDepthStatusEnum.Fresh,
    as_of: new Date("2026-09-11T10:02:00.000Z"),
    snapshots: [
      {
        id: "snapshot-b",
        source: "opensea-rest",
        collection_slug: "the-memes-by-6529",
        started_at: new Date("2026-09-11T10:00:00.000Z"),
        completed_at: new Date("2026-09-11T10:01:00.000Z"),
        order_count: 2,
        unsupported_count: 0,
        schema_version: 1,
        normalizer_version: "1",
      },
      {
        id: "snapshot-a",
        source: "blur-rest",
        collection_slug: "the-memes-by-6529",
        started_at: new Date("2026-09-11T10:00:00.000Z"),
        completed_at: new Date("2026-09-11T10:01:00.000Z"),
        order_count: 1,
        unsupported_count: 0,
        schema_version: 1,
        normalizer_version: "1",
      },
    ],
    books: BOOKS,
    orders: [],
    order_count: 0,
    next: null,
    criteria_order_count: 0,
    notes: [],
    ...overrides,
  };
}

const SNAPSHOT_CHANGES: ReadonlyArray<
  readonly [string, Partial<ApiMarketDepth>]
> = [
  ["contract", { contract: "0xother" }],
  ["token", { token_id: "9" }],
  [
    "snapshot IDs",
    { snapshots: [{ ...makeDepth().snapshots[0]!, id: "new" }] },
  ],
  ["as-of time", { as_of: new Date("2026-09-11T10:03:00.000Z") }],
  ["order count", { order_count: 3 }],
  [
    "books",
    {
      books: [
        {
          ...BOOKS[0]!,
          asks: [{ ...BOOKS[0]!.asks[0]!, quantity: "3" }],
        },
      ],
    },
  ],
];

describe("loadCompleteMarketDepth", () => {
  it("drains immutable pages and accepts the same snapshot IDs in another order", async () => {
    const first = makeOrder("order-1");
    const second = makeOrder("order-2");
    const third = makeOrder("order-3");
    const initial = makeDepth({
      orders: [first],
      order_count: 3,
      next: "cursor-1",
    });
    const initialOrders = [...initial.orders];
    const controller = new AbortController();
    const loadPage = jest.fn(async (cursor: string, signal: AbortSignal) => {
      expect(signal).toBe(controller.signal);
      if (cursor === "cursor-1") {
        return makeDepth({
          snapshots: [...initial.snapshots].reverse(),
          orders: [second],
          order_count: 3,
          next: "cursor-2",
        });
      }
      return makeDepth({
        orders: [third],
        order_count: 3,
        next: null,
      });
    });

    const result = await loadCompleteMarketDepth(
      initial,
      loadPage,
      controller.signal
    );

    expect(loadPage.mock.calls.map(([cursor]) => cursor)).toEqual([
      "cursor-1",
      "cursor-2",
    ]);
    expect(result.orders.map(({ order_key }) => order_key)).toEqual([
      "order-1",
      "order-2",
      "order-3",
    ]);
    expect(result.next).toBeNull();
    expect(result).not.toBe(initial);
    expect(initial.orders).toEqual(initialOrders);
    expect(initial.next).toBe("cursor-1");
  });

  it.each(SNAPSHOT_CHANGES)(
    "rejects a changed %s",
    async (_label, pageOverrides) => {
      const initial = makeDepth({
        orders: [makeOrder("order-1")],
        order_count: 2,
        next: "cursor-1",
      });
      const loadPage = async () =>
        makeDepth({
          orders: [makeOrder("order-2")],
          order_count: 2,
          ...pageOverrides,
        });

      await expect(
        loadCompleteMarketDepth(initial, loadPage, new AbortController().signal)
      ).rejects.toBeInstanceOf(MarketDepthSnapshotChangedError);
    }
  );

  it("rejects duplicate orders, repeated cursors, and pages without progress", async () => {
    const initial = makeDepth({
      orders: [makeOrder("order-1")],
      order_count: 2,
      next: "cursor-1",
    });
    const signal = new AbortController().signal;

    await expect(
      loadCompleteMarketDepth(
        initial,
        async () =>
          makeDepth({
            orders: [makeOrder("order-1")],
            order_count: 2,
          }),
        signal
      )
    ).rejects.toBeInstanceOf(MarketDepthSnapshotChangedError);

    await expect(
      loadCompleteMarketDepth(
        initial,
        async () =>
          makeDepth({
            orders: [makeOrder("order-2")],
            order_count: 2,
            next: "cursor-1",
          }),
        signal
      )
    ).rejects.toBeInstanceOf(MarketDepthSnapshotChangedError);

    await expect(
      loadCompleteMarketDepth(
        initial,
        async () => makeDepth({ orders: [], order_count: 2, next: "cursor-2" }),
        signal
      )
    ).rejects.toBeInstanceOf(MarketDepthSnapshotChangedError);
  });

  it("classifies HTTP 400 as a snapshot change and preserves network errors", async () => {
    const initial = makeDepth({ order_count: 1, next: "cursor-1" });
    const badRequest = Object.assign(new Error("book changed"), {
      status: 400,
    });
    const networkError = new TypeError("fetch failed");

    await expect(
      loadCompleteMarketDepth(
        initial,
        async () => Promise.reject(badRequest),
        new AbortController().signal
      )
    ).rejects.toBeInstanceOf(MarketDepthSnapshotChangedError);
    await expect(
      loadCompleteMarketDepth(
        initial,
        async () => Promise.reject(networkError),
        new AbortController().signal
      )
    ).rejects.toBe(networkError);
  });

  it("preserves abort errors instead of classifying or returning partial data", async () => {
    const initial = makeDepth({ order_count: 1, next: "cursor-1" });
    const controller = new AbortController();
    const reason = new Error("cancelled");

    await expect(
      loadCompleteMarketDepth(
        initial,
        async () => {
          controller.abort(reason);
          return makeDepth({ orders: [makeOrder("order-1")], order_count: 1 });
        },
        controller.signal
      )
    ).rejects.toBe(reason);
  });
});

describe("market depth order membership", () => {
  it("matches a level by exact side, price, address, decimals, and applicability", () => {
    const matching = makeOrder("matching", {
      currency: { ...ETH, address: ETH.address.toUpperCase() },
    });
    const orders = [
      matching,
      makeOrder("bid", { side: ApiMarketOrderSideEnum.Bid }),
      makeOrder("price", { unit_price: "1.250" }),
      makeOrder("address", {
        currency: { ...ETH, address: "0xother" },
      }),
      makeOrder("decimals", { currency: { ...ETH, decimals: 6 } }),
      makeOrder("criteria", {
        applicability: ApiMarketOrderApplicabilityEnum.CriteriaUnverified,
      }),
      makeOrder("unpriced", { unit_price: null }),
      makeOrder("quantity-unknown", { remaining_quantity: null }),
    ];

    expect(getLevelOrders(orders, ETH, "ask", "1.25")).toEqual([matching]);
  });

  it("keeps every order absent from the actual book levels as contextual detail", () => {
    const representedAsk = makeOrder("ask");
    const representedBid = makeOrder("bid", {
      side: ApiMarketOrderSideEnum.Bid,
      unit_price: "0.8",
    });
    const unpriced = makeOrder("unpriced", { unit_price: null });
    const unverified = makeOrder("unverified", {
      applicability: ApiMarketOrderApplicabilityEnum.CriteriaUnverified,
    });
    const unmatchedPrice = makeOrder("unmatched-price", { unit_price: "2" });
    const unmatchedCurrency = makeOrder("unmatched-currency", {
      currency: { ...ETH, address: "0xother" },
    });
    const data = makeDepth({
      orders: [
        representedAsk,
        representedBid,
        unpriced,
        unverified,
        unmatchedPrice,
        unmatchedCurrency,
      ],
      order_count: 6,
    });

    expect(getOtherOrders(data).map(({ order_key }) => order_key)).toEqual([
      "unpriced",
      "unverified",
      "unmatched-price",
      "unmatched-currency",
    ]);
    expect(getOtherOrderCount(data)).toBe(4);
  });
});
