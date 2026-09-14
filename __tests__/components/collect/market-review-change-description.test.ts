import { marketReviewChangeDescription } from "@/components/collect/market-review-change-description";
import { marketBatchReviewChange } from "@/components/collect/market-batch-validation";
import { MARKET_WETH } from "@/components/collect/market-validation";
import { batchFixture } from "./market-batch.fixture";

it("reports exact old/new network and maximum amounts without changing either snapshot", () => {
  const { operation: before } = batchFixture();
  const after = {
    ...before,
    transaction: { ...before.transaction!, gas_reserve_wei: "6000001" },
  };
  const snapshots = JSON.stringify([before, after]);
  expect(marketReviewChangeDescription(before, after, "en-US", "gas")).toBe(
    "Network fee cap changed from 0.000000000006 to 0.000000000006000001 ETH. " +
      "Maximum total changed from 0.00000000000600014 to 0.000000000006000141 ETH. " +
      "Review the updated terms before continuing."
  );
  expect(JSON.stringify([before, after])).toBe(snapshots);
  expect(marketBatchReviewChange(before, after)).toBe("gas");
});

it("identifies an increased component even when the aggregate reserve is unchanged", () => {
  const { operation: before } = batchFixture();
  const after = {
    ...before,
    transaction: { ...before.transaction!, gas_limit: "600001" },
  };
  expect(marketReviewChangeDescription(before, after, "en-US", "gas")).toBe(
    "Gas limit changed from 600,000 to 600,001. Review the updated terms before continuing."
  );
});

it("reports exact price and fee changes without mixing WETH with ETH network fees", () => {
  const { operation } = batchFixture();
  const before = { ...operation, currency: MARKET_WETH };
  const after = {
    ...before,
    total_wei: "141",
    items: before.items.map((item, index) => ({
      ...item,
      fees: item.fees!.map((fee) => ({
        ...fee,
        amount_wei: index === 0 ? "11" : fee.amount_wei,
      })),
    })),
  };
  const message = marketReviewChangeDescription(
    before,
    after,
    "en-US",
    "terms"
  );
  expect(message).toContain(
    "Trade total changed from 0.00000000000000014 to 0.000000000000000141 WETH."
  );
  expect(message).toContain(
    "Included fees changed from 0.000000000000000014 to 0.000000000000000015 WETH."
  );
  expect(message).not.toContain("Maximum total");
});

it("explains an increased gas price limit even when the aggregate cap decreases", () => {
  const { operation: before } = batchFixture();
  const after = {
    ...before,
    transaction: {
      ...before.transaction!,
      gas_limit: "100000",
      max_fee_per_gas: "11",
      gas_reserve_wei: "1100000",
    },
  };
  expect(marketBatchReviewChange(before, after)).toBe("gas");
  expect(
    marketReviewChangeDescription(before, after, "en-US", "gas")
  ).toContain("Gas price limit changed from 0.00000001 to 0.000000011 Gwei.");
});

it("identifies the actual artwork when quantity changes", () => {
  const { operation: before } = batchFixture();
  const after = {
    ...before,
    items: before.items.map((item, index) =>
      index === 1 ? { ...item, quantity: "3" } : item
    ),
  };
  expect(
    marketReviewChangeDescription(before, after, "en-US", "terms")
  ).toContain("Quantity for The Memes #73 changed from 2 to 3.");
});

it("does not confuse two different orders for the same artwork", () => {
  const { operation } = batchFixture();
  const first = operation.items[0]!;
  const second = {
    ...first,
    quantity: "2",
    order: { ...first.order, order_hash: `0x${"b".repeat(64)}` },
  };
  const before = { ...operation, items: [first, second] };
  const after = {
    ...before,
    transaction: { ...before.transaction!, gas_limit: "600001" },
  };
  expect(
    marketReviewChangeDescription(before, after, "en-US", "gas")
  ).not.toContain("Quantity");
});

it("does not invent a missing fee breakdown or incomplete maximum", () => {
  const { operation } = batchFixture();
  const before = {
    ...operation,
    items: operation.items.map(({ fees: _fees, ...item }) => item),
  };
  const after = { ...before, total_wei: "141" };
  const message = marketReviewChangeDescription(
    before,
    after,
    "en-US",
    "terms"
  );
  expect(message).toContain("Trade total changed");
  expect(message).not.toContain("Included fees");
  expect(message).not.toContain("Maximum total");
});

it("formats exact differences using the requested locale with English fallback", () => {
  const { operation: before } = batchFixture();
  const after = {
    ...before,
    transaction: { ...before.transaction!, gas_limit: "600001" },
  };
  expect(
    marketReviewChangeDescription(before, after, "de-DE", "gas")
  ).toContain("600.000 to 600.001");
});

it("does not invent a monetary difference for an unrecognized terms change", () => {
  const { operation } = batchFixture();
  expect(
    marketReviewChangeDescription(operation, operation, "en-US", "terms")
  ).toBe("Terms changed. Review the updated details before continuing.");
});
