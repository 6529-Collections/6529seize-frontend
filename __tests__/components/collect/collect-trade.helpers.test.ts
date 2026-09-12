import {
  buildMarketRequest,
  marketConnectionReason,
} from "@/components/collect/collect-trade.helpers";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import {
  MARKET_SEAPORT,
  MARKET_ZERO,
} from "@/components/collect/market-validation";

const wallet = "0x1111111111111111111111111111111111111111";
const profile = { id: "current-profile", wallets: [{ wallet }] } as ApiIdentity;
const operation = {
  id: "old-operation",
  profile_id: "old-profile",
  wallet,
  recipient: wallet,
  quantity: "2",
  currency: MARKET_ZERO,
  total_wei: "1000",
  asset_key: "1:nft:1",
  order: {
    protocol_address: MARKET_SEAPORT,
    order_hash: `0x${"a".repeat(64)}`,
  },
} as ApiMarketOperation;
const connection = {
  capabilityEnabled: true,
  isNative: false,
  isProxy: false,
  isSafe: false,
  isAuthenticated: true,
  canSign: true,
  address: wallet,
  profile,
  operation: null,
  hasExpected: true,
  cancelTarget: undefined,
};
it.each(["offer", "list"] as const)(
  "keeps a 30-day %s inside the API duration cap when the fresh block lags",
  (action) => {
    const now = 1_900_000_000_000;
    const clock = jest.spyOn(Date, "now").mockReturnValue(now);
    try {
      const request = buildMarketRequest({
        profile,
        wallet,
        action,
        assetKey: operation.asset_key,
        selectedOrder: null,
        cancelTarget: undefined,
        draft: {
          quantity: "1",
          unitPriceEth: "1",
          expiryHours: "720",
          recipient: wallet,
        },
      });
      for (const blockLagSeconds of [12, 60, 120]) {
        const latestBlockTimestamp = now / 1000 - blockLagSeconds;
        expect(request.expires_at).toBeLessThanOrEqual(
          latestBlockTimestamp + 30 * 24 * 3600
        );
        expect(request.expires_at).toBeGreaterThan(
          latestBlockTimestamp + 29 * 24 * 3600
        );
      }
    } finally {
      clock.mockRestore();
    }
  }
);
it("keeps historical operations inspectable but prevents resuming an old-profile intent", () => {
  expect(marketConnectionReason({ ...connection, operation })).toBe(
    "collect.trade.originalProfile"
  );
});
it("allows cancelling an old profile's order from the original wallet", () => {
  expect(
    marketConnectionReason({ ...connection, cancelTarget: operation })
  ).toBeUndefined();
  expect(
    buildMarketRequest({
      profile,
      wallet,
      action: "cancel",
      assetKey: operation.asset_key,
      selectedOrder: null,
      cancelTarget: operation,
      draft: {
        quantity: "1",
        unitPriceEth: "",
        expiryHours: "168",
        recipient: wallet,
      },
    })
  ).toMatchObject({
    profile_id: "current-profile",
    wallet,
    kind: "CANCEL",
    amount_wei: "0",
    quantity: "2",
    order: { order_hash: operation.order!.order_hash },
  });
});
it("requires the original execution wallet to cancel a historical order", () => {
  const other = "0x2222222222222222222222222222222222222222";
  expect(
    marketConnectionReason({
      ...connection,
      address: other,
      profile: { ...profile, wallets: [{ wallet: other }] } as ApiIdentity,
      cancelTarget: operation,
    })
  ).toBe("collect.trade.reconnect");
});

it.each([undefined, []])(
  "accepts the confirmed primary destination when the wallet array is absent or empty: %j",
  (wallets) => {
    expect(
      buildMarketRequest({
        profile: { ...profile, primary_wallet: wallet, wallets } as ApiIdentity,
        wallet,
        action: "buy",
        assetKey: operation.asset_key,
        selectedOrder: null,
        cancelTarget: undefined,
        draft: {
          quantity: "1",
          unitPriceEth: "1",
          expiryHours: "168",
          recipient: wallet,
        },
      })
    ).toMatchObject({
      recipient: wallet,
      acknowledge_external_recipient: false,
    });
  }
);

it("does not infer primary membership when a supplied wallet list excludes it", () => {
  const other = "0x2222222222222222222222222222222222222222";
  expect(() =>
    buildMarketRequest({
      profile: {
        ...profile,
        primary_wallet: wallet,
        wallets: [{ wallet: other }],
      } as ApiIdentity,
      wallet: other,
      action: "buy",
      assetKey: operation.asset_key,
      selectedOrder: null,
      cancelTarget: undefined,
      draft: {
        quantity: "1",
        unitPriceEth: "1",
        expiryHours: "168",
        recipient: wallet,
      },
    })
  ).toThrow("RECIPIENT_NOT_ACKNOWLEDGED");
});

it("retains authentication gates when the connected payer uses the primary fallback", () => {
  const fallbackProfile = {
    ...profile,
    primary_wallet: wallet,
  };
  delete fallbackProfile.wallets;
  expect(
    marketConnectionReason({ ...connection, profile: fallbackProfile })
  ).toBeUndefined();
  expect(
    marketConnectionReason({
      ...connection,
      profile: fallbackProfile,
      isAuthenticated: false,
    })
  ).toBe("collect.trade.connectSigner");
  expect(
    marketConnectionReason({
      ...connection,
      profile: fallbackProfile,
      isSafe: true,
    })
  ).toBe("collect.trade.safeUnavailable");
});
