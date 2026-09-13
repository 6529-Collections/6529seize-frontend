import { marketBatchReviewChange } from "@/components/collect/market-batch-validation";
import { marketGasCapsWithinReview } from "@/components/collect/market-review-caps";
import { batchFixture } from "./market-batch.fixture";

it.each([
  { gas_limit: "500000", max_fee_per_gas: "9", gas_reserve_wei: "4500000" },
  { gas_limit: "600000", max_fee_per_gas: "10", gas_reserve_wei: "6000000" },
])("allows each ceiling only within the shown review: %j", (caps) => {
  const { operation: shown } = batchFixture();
  const fresh = { ...shown, transaction: { ...shown.transaction!, ...caps } };
  expect(marketBatchReviewChange(shown, fresh)).toBeNull();
  expect(fresh.transaction).toMatchObject(caps);
});

it.each([
  { gas_limit: "600001", max_fee_per_gas: "9", gas_reserve_wei: "5400009" },
  { gas_limit: "100000", max_fee_per_gas: "11", gas_reserve_wei: "1100000" },
  { gas_limit: "500000", max_fee_per_gas: "9", gas_reserve_wei: "6000001" },
])(
  "requires review of any increased ceiling, even if total gas cost falls: %j",
  (caps) => {
    const { operation: shown } = batchFixture();
    expect(
      marketBatchReviewChange(shown, {
        ...shown,
        transaction: { ...shown.transaction!, ...caps },
      })
    ).toBe("gas");
  }
);

it("never spends gas savings on a changed NFT price", () => {
  const { operation: shown } = batchFixture();
  expect(
    marketBatchReviewChange(shown, {
      ...shown,
      total_wei: (BigInt(shown.total_wei) + 1n).toString(),
      transaction: { ...shown.transaction!, max_fee_per_gas: "1" },
    })
  ).toBe("terms");
});

it.each(["0", "-1", "1.0", "01", "invalid", undefined])(
  "rejects malformed or removed gas ceilings: %s",
  (value) => {
    expect(
      marketGasCapsWithinReview(
        { gas_limit: "10" },
        value === undefined ? {} : { gas_limit: value }
      )
    ).toBe(false);
  }
);
