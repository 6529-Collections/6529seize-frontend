import {
  collectBuyAmount,
  collectBuyListings,
  collectListingKey,
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
  return {
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
  };
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
