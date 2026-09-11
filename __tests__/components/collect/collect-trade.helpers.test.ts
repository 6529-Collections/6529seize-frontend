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
