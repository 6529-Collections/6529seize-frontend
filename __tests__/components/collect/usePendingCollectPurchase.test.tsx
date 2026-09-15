import { renderHook } from "@testing-library/react";
import { usePendingCollectPurchase } from "@/components/collect/usePendingCollectPurchase";
import type { PendingMarketPurchase } from "@/components/collect/market-activity-store";

let mockPending: readonly PendingMarketPurchase[] = [];
jest.mock("@/components/collect/market-activity-store", () => ({
  usePendingMarketPurchases: () => [],
  readPendingMarketPurchases: (profile: string) =>
    mockPending.filter((purchase) => purchase.profileId === profile),
}));
const purchase: PendingMarketPurchase = {
  profileId: "profile",
  operationId: "pending-operation",
  assetKey: `1:0x${"a".repeat(40)}:1`,
  protocolAddress: `0x${"b".repeat(40)}`,
  orderHash: `0x${"c".repeat(64)}`,
  quantity: "1",
};
const options = {
  profileId: "profile",
  assetKey: purchase.assetKey,
  identity: {
    protocol_address: purchase.protocolAddress,
    order_hash: purchase.orderHash,
  },
  operationId: "review-operation",
  enabled: true,
};
beforeEach(() => {
  mockPending = [];
});

it("guards the final wallet boundary against a purchase submitted since render", () => {
  const { result } = renderHook(() => usePendingCollectPurchase(options));
  expect(result.current.blocked).toBe(false);
  mockPending = [purchase];
  expect(() => result.current.assertAvailable()).toThrow(
    "MARKET_PURCHASE_PENDING"
  );
});

it.each([
  { ...options, operationId: purchase.operationId },
  { ...options, profileId: "different-profile" },
  { ...options, enabled: false },
  { ...options, assetKey: `${purchase.assetKey}0` },
  {
    ...options,
    identity: { ...options.identity, protocol_address: `0x${"d".repeat(40)}` },
  },
  {
    ...options,
    identity: { ...options.identity, order_hash: `0x${"d".repeat(64)}` },
  },
])("permits a resumed operation or a nonmatching reservation %#", (scope) => {
  mockPending = [purchase];
  const { result } = renderHook(() => usePendingCollectPurchase(scope));
  expect(() => result.current.assertAvailable()).not.toThrow();
});
