import type { ApiMarketTransaction } from "@/generated/models/ApiMarketTransaction";

type GasCaps = Pick<
  ApiMarketTransaction,
  "gas_limit" | "max_fee_per_gas" | "gas_reserve_wei"
>;

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
