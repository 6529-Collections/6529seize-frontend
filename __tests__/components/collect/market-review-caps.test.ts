import { marketBatchReviewChange } from "@/components/collect/market-batch-validation";
import {
  marketGasCapsWithinReview,
  reviewedMarketGasLimits,
} from "@/components/collect/market-review-caps";
import { batchFixture } from "./market-batch.fixture";
import type { PublicClient } from "viem";

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

describe("reviewed inclusion requirements", () => {
  function setup() {
    const client = {
      getBlock: jest.fn().mockResolvedValue({ baseFeePerGas: 8n }),
      estimateFeesPerGas: jest.fn().mockResolvedValue({
        maxFeePerGas: 20n,
        maxPriorityFeePerGas: 1n,
      }),
    };
    const caps = {
      gas_limit: "600000",
      max_fee_per_gas: "10",
      gas_reserve_wei: "6000000",
    };
    return { client, caps, publicClient: client as unknown as PublicClient };
  }

  it("keeps exact approved ceilings when the new padded suggestion exceeds them", async () => {
    const { client, caps, publicClient } = setup();
    await expect(
      reviewedMarketGasLimits(publicClient, caps, 500000n)
    ).resolves.toEqual({
      gas: 600000n,
      maxFeePerGas: 10n,
      maxPriorityFeePerGas: 1n,
    });
    expect(client.getBlock).toHaveBeenCalledWith({ blockTag: "latest" });
  });

  it.each(["gas", "base fee", "priority fee", "reserve"])(
    "rejects a genuine %s overrun without changing an approved ceiling",
    async (requirement) => {
      const { client, caps, publicClient } = setup();
      let estimate = 500000n;
      if (requirement === "gas") estimate = 600001n;
      if (requirement === "base fee")
        client.getBlock.mockResolvedValue({ baseFeePerGas: 10n });
      if (requirement === "priority fee")
        client.estimateFeesPerGas.mockResolvedValue({
          maxFeePerGas: 20n,
          maxPriorityFeePerGas: 3n,
        });
      if (requirement === "reserve") caps.gas_reserve_wei = "5999999";
      await expect(
        reviewedMarketGasLimits(publicClient, caps, estimate)
      ).rejects.toThrow("MARKET_GAS_CAP_CHANGED");
      expect(caps.max_fee_per_gas).toBe("10");
    }
  );

  it.each([null, undefined, -1n])(
    "rejects unavailable or invalid latest base fee %s",
    async (baseFeePerGas) => {
      const { client, caps, publicClient } = setup();
      client.getBlock.mockResolvedValue({ baseFeePerGas });
      await expect(
        reviewedMarketGasLimits(publicClient, caps, 500000n)
      ).rejects.toThrow("MARKET_FEE_ESTIMATE_UNAVAILABLE");
    }
  );
});
