import { act, renderHook } from "@testing-library/react";
import { useCollectPurchaseSelection } from "@/components/collect/useCollectPurchaseSelection";
import type { PendingMarketPurchase } from "@/components/collect/market-activity-store";
import { targetPlan } from "./collect-tdh-target.fixture";

const empty: readonly never[] = [];
let mockCurrentPending: readonly PendingMarketPurchase[] = [];
jest.mock("@/components/collect/market-activity-store", () => ({
  useConfirmedMarketPurchases: () => empty,
  usePendingMarketPurchases: () => empty,
  readPendingMarketPurchases: () => mockCurrentPending,
}));
it("uses event-time evidence for Clear even when pending changes after render", () => {
  mockCurrentPending = [];
  const first = targetPlan().items[0]!;
  const second = {
    ...first,
    order: {
      ...first.order,
      identity: { ...first.order.identity, order_hash: "another-order" },
    },
  };
  const { result } = renderHook(() => useCollectPurchaseSelection("profile"));
  act(() => result.current.setSelection([first, second]));
  const clear = result.current.clearSelection;
  mockCurrentPending = [
    {
      profileId: "profile",
      operationId: "operation",
      assetKey: first.asset.asset_key,
      protocolAddress: first.order.identity.protocol_address,
      orderHash: first.order.identity.order_hash,
      quantity: "1",
    },
  ];
  act(() => clear());
  expect(result.current.selection).toEqual([first]);
});
