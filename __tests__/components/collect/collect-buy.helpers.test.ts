import {
  collectBuyAmount,
  collectBuyListings,
  collectListingKey,
  collectOrderPurchaseQuantity,
} from "@/components/collect/collect-buy.helpers";
import {
  MARKET_SEAPORT,
  MARKET_ZERO,
  MARKET_WETH,
} from "@/components/collect/market-validation";
import {
  ApiMarketTradeOrderSideEnum,
  type ApiMarketTradeOrder,
} from "@/generated/models/ApiMarketTradeOrder";

const asset = "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:1";
const maker = "0x1111111111111111111111111111111111111111";
function listing(
  patch: Partial<ApiMarketTradeOrder> = {}
): ApiMarketTradeOrder {
  return Object.assign(
    {
      identity: {
        protocol_address: MARKET_SEAPORT,
        order_hash: `0x${"a".repeat(64)}`,
      },
      asset_key: asset,
      maker,
      side: ApiMarketTradeOrderSideEnum.Listing,
      quantity: "2",
      currency: MARKET_ZERO,
      total_wei: "8",
      net_wei: "6",
      fees: [],
      start_time: "1",
      end_time: "300",
      recipient: MARKET_ZERO,
      ...patch,
    },
    {
      purchase_quantity: "1",
      quantity_step: "1",
      available_quantity: patch.quantity ?? "2",
    }
  );
}
function candidates(
  orders: ApiMarketTradeOrder[],
  profileWallets: string[] = []
) {
  return collectBuyListings({
    orders,
    assetKey: asset,
    quantity: "1",
    profileWallets,
    nowSeconds: 100,
  });
}
it("prices requested copies using exact consideration including fees", () => {
  expect(collectBuyAmount(listing(), "1")).toBe("4");
  expect(collectBuyAmount(listing(), "2")).toBe("8");
  expect(collectBuyAmount(listing({ total_wei: "9" }), "1")).toBeNull();
});
it.each(["0", "3", "-1", "1.5", "01", "1e1", "", "9".repeat(78)])(
  "rejects unsupported quantity %s",
  (quantity) => {
    expect(collectBuyAmount(listing(), quantity)).toBeNull();
  }
);
it("compares exact unit costs without mutating discovery order", () => {
  const expensive = listing({ total_wei: "10" });
  const cheap = listing({ quantity: "1", total_wei: "3" });
  const orders = [expensive, cheap];
  expect(candidates(orders)).toEqual([cheap, expensive]);
  expect(orders).toEqual([expensive, cheap]);
});
it("does not choose another asset, currency, protocol, inactive or self listing", () => {
  const otherMaker = "0x2222222222222222222222222222222222222222";
  const valid = listing({ maker: otherMaker });
  expect(
    candidates(
      [
        listing(),
        listing({ asset_key: `${asset}0` }),
        listing({ currency: MARKET_WETH }),
        listing({ side: ApiMarketTradeOrderSideEnum.Offer }),
        listing({ start_time: "101" }),
        listing({ end_time: "100" }),
        listing({ identity: { ...valid.identity, protocol_address: maker } }),
        valid,
      ],
      [maker]
    )
  ).toEqual([valid]);
});
it("keeps exact listing identity distinct across assets and protocols", () => {
  const order = listing();
  expect(collectListingKey(order)).not.toBe(
    collectListingKey(listing({ asset_key: `${asset}0` }))
  );
  expect(collectListingKey(order)).not.toBe(
    collectListingKey(
      listing({ identity: { ...order.identity, protocol_address: maker } })
    )
  );
});

it("does not infer a one-copy purchase for a full-only or fee-indivisible edition lot", () => {
  const fullOnly = {
    ...listing({ quantity: "2", total_wei: "200", net_wei: "200" }),
    purchase_quantity: "2",
    quantity_step: "2",
  };
  expect(collectOrderPurchaseQuantity(fullOnly)).toBe("2");
  expect(collectBuyAmount(fullOnly, "1")).toBeNull();
  expect(collectBuyAmount(fullOnly, "2")).toBe("200");
  const indivisible = {
    ...fullOnly,
    net_wei: "199",
    fees: [{ recipient: maker, amount_wei: "1" }],
    quantity_step: "1",
  };
  expect(collectBuyAmount(indivisible, "1")).toBeNull();
  expect(collectBuyAmount(indivisible, "2")).toBe("200");
});

it("uses explicit available quantity separately from the quoted unit-price basis", () => {
  const normalized = {
    ...listing({ quantity: "1", total_wei: "7", net_wei: "7" }),
    available_quantity: "3",
  };
  expect(collectOrderPurchaseQuantity(normalized)).toBe("1");
  expect(collectBuyAmount(normalized, "3")).toBe("21");
  expect(collectBuyAmount(normalized, "4")).toBeNull();
});

it("defaults legacy discovery to its exact whole lot", () => {
  const {
    purchase_quantity: _purchase,
    quantity_step: _step,
    available_quantity: _available,
    ...legacy
  } = Object.assign(listing(), {
    purchase_quantity: "1",
    quantity_step: "1",
    available_quantity: "2",
  });
  expect(collectOrderPurchaseQuantity(legacy)).toBe("2");
  expect(collectBuyAmount(legacy, "1")).toBeNull();
});
