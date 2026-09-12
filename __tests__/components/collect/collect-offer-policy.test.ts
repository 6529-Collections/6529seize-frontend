import {
  assertCollectOfferAmount,
  assertCollectOfferQuantity,
} from "@/components/collect/collect-offer-policy";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import {
  MARKET_WETH,
  MARKET_ZERO,
} from "@/components/collect/market-validation";

const UINT256_MAX = (1n << 256n) - 1n;

function request(
  amount_wei = "200",
  kind = ApiMarketKind.Offer
): ApiMarketPrepareRequest {
  return {
    profile_id: "profile",
    wallet: "0x1111111111111111111111111111111111111111",
    recipient: "0x1111111111111111111111111111111111111111",
    asset_key: "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:1",
    kind,
    quantity: "2",
    currency: MARKET_WETH,
    amount_wei,
    expires_at: 1_900_000_000,
    acknowledge_external_recipient: false,
  };
}

describe("collect offer amount policy", () => {
  it("accepts the exact full-quantity ceiling", () => {
    expect(() => assertCollectOfferAmount(request(), "200")).not.toThrow();
  });

  it("rejects a full-quantity offer above the ceiling", () => {
    expect(() => assertCollectOfferAmount(request("201"), "200")).toThrow(
      "MARKET_OFFER_LIMIT_EXCEEDED"
    );
  });

  it.each(["", "01", "-1", (UINT256_MAX + 1n).toString()])(
    "rejects a malformed ceiling: %s",
    (maximum) => {
      expect(() => assertCollectOfferAmount(request(), maximum)).toThrow(
        "MARKET_OFFER_LIMIT_EXCEEDED"
      );
    }
  );

  it.each(["01", (UINT256_MAX + 1n).toString()])(
    "rejects a malformed request amount: %s",
    (amount) => {
      expect(() =>
        assertCollectOfferAmount(request(amount), UINT256_MAX.toString())
      ).toThrow("MARKET_OFFER_LIMIT_EXCEEDED");
    }
  );

  it("requires WETH for a bounded offer", () => {
    expect(() =>
      assertCollectOfferAmount({ ...request(), currency: MARKET_ZERO }, "200")
    ).toThrow("MARKET_OFFER_LIMIT_EXCEEDED");
  });

  it("does not apply an offer ceiling to other actions", () => {
    expect(() =>
      assertCollectOfferAmount(
        {
          ...request("not-an-amount", ApiMarketKind.List),
          currency: MARKET_ZERO,
        },
        "not-a-limit"
      )
    ).not.toThrow();
  });
});

describe("collect offer quantity policy", () => {
  it("accepts the exact fixed offer quantity", () => {
    expect(() => assertCollectOfferQuantity(request(), "2")).not.toThrow();
  });

  it.each(["1", "3"])("rejects a changed offer quantity: %s", (quantity) => {
    expect(() =>
      assertCollectOfferQuantity({ ...request(), quantity }, "2")
    ).toThrow("MARKET_OFFER_QUANTITY_CHANGED");
  });

  it.each(["", "0", "01", "-1", (UINT256_MAX + 1n).toString()])(
    "rejects a malformed fixed quantity: %s",
    (fixed) => {
      expect(() => assertCollectOfferQuantity(request(), fixed)).toThrow(
        "MARKET_OFFER_QUANTITY_CHANGED"
      );
    }
  );

  it.each(["0", "02", (UINT256_MAX + 1n).toString()])(
    "rejects a noncanonical request quantity: %s",
    (quantity) => {
      expect(() =>
        assertCollectOfferQuantity({ ...request(), quantity }, "2")
      ).toThrow("MARKET_OFFER_QUANTITY_CHANGED");
    }
  );

  it("does not apply quantity binding without a fixed quantity", () => {
    expect(() =>
      assertCollectOfferQuantity({ ...request(), quantity: "not-a-quantity" })
    ).not.toThrow();
  });

  it("does not apply offer quantity binding to another action", () => {
    expect(() =>
      assertCollectOfferQuantity(
        { ...request(), kind: ApiMarketKind.List, quantity: "not-a-quantity" },
        "not-a-fixed-quantity"
      )
    ).not.toThrow();
  });
});
