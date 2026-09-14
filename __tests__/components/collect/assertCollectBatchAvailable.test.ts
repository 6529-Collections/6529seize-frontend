import { assertCollectBatchAvailable } from "@/components/collect/assertCollectBatchAvailable";
import type { PendingMarketPurchase } from "@/components/collect/market-activity-store";
import { batchFixture } from "./market-batch.fixture";

let mockPending: readonly PendingMarketPurchase[] = [];
jest.mock("@/components/collect/market-activity-store", () => ({
  readPendingMarketPurchases: (profileId: string) =>
    mockPending.filter((purchase) => purchase.profileId === profileId),
}));

const { request } = batchFixture();
const item = request.items[0]!;
const purchase: PendingMarketPurchase = {
  profileId: request.profile_id,
  operationId: "pending-single-purchase",
  assetKey: item.asset_key,
  protocolAddress: item.order.protocol_address,
  orderHash: item.order.order_hash,
  quantity: "1",
};
beforeEach(() => {
  mockPending = [];
});

it("reserves an exact source order purchased through another entry point", () => {
  expect(() => assertCollectBatchAvailable(request)).not.toThrow();
  mockPending = [purchase];
  expect(() => assertCollectBatchAvailable(request)).toThrow(
    "MARKET_PURCHASE_PENDING"
  );
  expect(() =>
    assertCollectBatchAvailable(request, purchase.operationId)
  ).not.toThrow();
});

it.each([
  { profileId: "different-profile" },
  { assetKey: `${purchase.assetKey}0` },
  { protocolAddress: `0x${"f".repeat(40)}` },
  { orderHash: `0x${"f".repeat(64)}` },
])("allows an independent source order or profile %#", (difference) => {
  mockPending = [{ ...purchase, ...difference }];
  expect(() => assertCollectBatchAvailable(request)).not.toThrow();
});
