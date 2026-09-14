import type { ApiMarketTransaction } from "@/generated/models/ApiMarketTransaction";
import type { PublicClient } from "viem";

type GasCaps = Pick<
  ApiMarketTransaction,
  "gas_limit" | "max_fee_per_gas" | "gas_reserve_wei"
>;

function reviewedCap(value: string | undefined): bigint {
  if (value === undefined) throw new Error("MARKET_GAS_CAP_MISSING");
  if (!/^[1-9]\d*$/.test(value)) throw new Error("MARKET_GAS_CAP_CHANGED");
  return BigInt(value);
}

/** Check current inclusion requirements, then send only the ceilings already reviewed. */
export async function reviewedMarketGasLimits(
  client: PublicClient,
  transaction: GasCaps,
  estimatedGas: bigint
) {
  const gas = reviewedCap(transaction.gas_limit);
  const maxFeePerGas = reviewedCap(transaction.max_fee_per_gas);
  const reserve = reviewedCap(transaction.gas_reserve_wei);
  if (
    estimatedGas <= 0n ||
    estimatedGas > gas ||
    gas > 16_777_216n ||
    gas * maxFeePerGas > reserve
  )
    throw new Error("MARKET_GAS_CAP_CHANGED");
  const [block, fees] = await Promise.all([
    client.getBlock({ blockTag: "latest" }),
    client.estimateFeesPerGas(),
  ]);
  const baseFee = block.baseFeePerGas;
  const priorityFee = fees.maxPriorityFeePerGas;
  if (
    typeof baseFee !== "bigint" ||
    baseFee < 0n ||
    typeof priorityFee !== "bigint" ||
    priorityFee < 0n
  )
    throw new Error("MARKET_FEE_ESTIMATE_UNAVAILABLE");
  // RPC maxFeePerGas is a newly padded suggestion, not the fee needed now.
  if (baseFee + priorityFee > maxFeePerGas)
    throw new Error("MARKET_GAS_CAP_CHANGED");
  return { gas, maxFeePerGas, maxPriorityFeePerGas: priorityFee };
}

/** A refreshed quote may spend less, but may not raise any reviewed ceiling. */
export function marketGasCapsWithinReview(
  shown: GasCaps | undefined,
  fresh: GasCaps | undefined
): boolean {
  if (!shown || !fresh) return shown === fresh;
  return (["gas_limit", "max_fee_per_gas", "gas_reserve_wei"] as const).every(
    (key) => {
      const before = shown[key],
        after = fresh[key];
      if (before === undefined && after === undefined) return true;
      return (
        typeof before === "string" &&
        typeof after === "string" &&
        /^[1-9]\d*$/.test(before) &&
        /^[1-9]\d*$/.test(after) &&
        BigInt(after) <= BigInt(before)
      );
    }
  );
}

export function withReviewedGasCaps<T extends GasCaps>(
  fresh: T,
  shown: GasCaps
): T {
  return {
    ...fresh,
    gas_limit: shown.gas_limit,
    max_fee_per_gas: shown.max_fee_per_gas,
    gas_reserve_wei: shown.gas_reserve_wei,
  };
}
