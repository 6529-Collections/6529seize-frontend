/** Wallet forwarding: exact chain-id parsing. */

import { INVALID_PARAMS, WRONG_CHAIN } from "./shared";

/** The largest chain id accepted: 2^53 - 1, so every id is exact. */
const MAX_CHAIN_ID = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * A chain id as wallets send it: a safe integer, or a decimal or `0x` hex
 * string, in 1..2^53-1. Strings are read with BigInt, so no value is
 * rounded before the bound is checked.
 */
export function readChainId(value: unknown): number | null {
  let parsed: bigint | null = null;
  if (typeof value === "number") {
    parsed = Number.isSafeInteger(value) ? BigInt(value) : null;
  } else if (typeof value === "string" && /^0x[0-9a-fA-F]{1,16}$/.test(value)) {
    parsed = BigInt(value);
  } else if (typeof value === "string" && /^[1-9]\d{0,19}$/.test(value)) {
    parsed = BigInt(value);
  }
  return parsed !== null && parsed > 0n && parsed <= MAX_CHAIN_ID
    ? Number(parsed)
    : null;
}

/** An optional chain id in the request must be the request's chain. */
export function checkChainId(
  value: unknown,
  chainId: number
): typeof INVALID_PARAMS | typeof WRONG_CHAIN | null {
  if (value === undefined) return null;
  const parsed = readChainId(value);
  if (parsed === null) return INVALID_PARAMS;
  return parsed === chainId ? null : WRONG_CHAIN;
}
