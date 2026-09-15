import { marketReceiptRefreshInterval } from "@/components/collect/market-receipt-refresh";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import type { ApiMarketBatchSettlementItem } from "@/generated/models/ApiMarketBatchSettlementItem";
import { ApiMarketBatchOperationStateEnum } from "@/generated/models/ApiMarketBatchOperation";
import { batchFixture } from "./market-batch.fixture";

function batch(): ApiMarketBatchOperation {
  return {
    ...batchFixture().operation,
    state: ApiMarketBatchOperationStateEnum.Confirmed,
    transaction_hash: `0x${"1".repeat(64)}`,
    updated_at: 1000,
    receipt: {
      transactions: [],
      payment: { currency: "ETH", total_wei: "140", net_wei: "126", fees: [] },
    },
  };
}
function settled(
  value: ApiMarketBatchOperation
): ApiMarketBatchSettlementItem[] {
  return value.items.map((item) => ({
    ...item,
    filled_quantity: "1",
    allocations: [],
    order_remaining_quantity: "0",
  }));
}

it("keeps supplement polling until every exact batch order has whole-order evidence", () => {
  const value = batch();
  expect(marketReceiptRefreshInterval(value, 2000)).toBe(30_000);
  const items = settled(value);
  for (const partial of [[], items.slice(0, 1), [items[0]!, items[0]!]]) {
    expect(
      marketReceiptRefreshInterval(
        { ...value, settlement: { items: partial } } as ApiMarketBatchOperation,
        2000
      )
    ).toBe(30_000);
  }
  expect(
    marketReceiptRefreshInterval(
      { ...value, settlement: { items } } as ApiMarketBatchOperation,
      2000
    )
  ).toBe(false);
  expect(marketReceiptRefreshInterval(value, 601_001)).toBe(false);
});

it("does not accept batch evidence for the same hash on a different protocol", () => {
  const value = batch();
  const items = settled(value).map((item) => ({
    ...item,
    order: { ...item.order, protocol_address: `0x${"3".repeat(40)}` },
  }));
  expect(
    marketReceiptRefreshInterval(
      { ...value, settlement: { items } } as ApiMarketBatchOperation,
      2000
    )
  ).toBe(30_000);
});

it("bounds supplementary confirmed receipt retries without converting missing evidence into failure", () => {
  const operation = {
    state: "CONFIRMED",
    transaction_hash: `0x${"1".repeat(64)}`,
    updated_at: 1000,
  } as ApiMarketOperation;
  expect(marketReceiptRefreshInterval(operation, 2000)).toBe(30_000);
  expect(marketReceiptRefreshInterval(operation, 601_001)).toBe(false);
});

it("keeps a live listing updated and does not promise gas for an off-chain listing acknowledgement", () => {
  expect(
    marketReceiptRefreshInterval({ state: "LIVE" } as ApiMarketOperation)
  ).toBe(30_000);
  expect(
    marketReceiptRefreshInterval({
      state: "CONFIRMED",
      kind: "LIST",
      updated_at: Date.now(),
    } as ApiMarketOperation)
  ).toBe(false);
});
