/** Wallet forwarding: the browser page's answer, returned through the app link. */

import type { Hex } from "viem";
import {
  type DesktopScheme,
  isRecord,
  REQUEST_ID,
  SIGNATURE,
  TRANSACTION_HASH,
  WALLET_FORWARDING_VERSION,
  type WalletForwardingMethod,
} from "./shared";

/** Why the browser page did not return a signature or transaction hash. */
export const WALLET_RESULT_FAILURES = [
  "rejected",
  "failed",
  "wrong-account",
  "wrong-chain",
  "refused",
] as const;

export type WalletResultFailure = (typeof WALLET_RESULT_FAILURES)[number];

/** What the browser page sends back through `<scheme>://wallet?data=`. */
export type WalletResult =
  | {
      readonly v: typeof WALLET_FORWARDING_VERSION;
      readonly id: string;
      readonly ok: true;
      readonly value: Hex;
    }
  | {
      readonly v: typeof WALLET_FORWARDING_VERSION;
      readonly id: string;
      readonly ok: false;
      readonly code: WalletResultFailure;
    };

/** `v`, `id`, `ok` and `value` (success) or `code` (failure), nothing else. */
function hasResultKeys(value: Record<string, unknown>): boolean {
  const own = Object.keys(value);
  const expected = ["v", "id", "ok", value["ok"] === true ? "value" : "code"];
  return (
    own.length === expected.length && expected.every((key) => own.includes(key))
  );
}

/** A 65-byte signature, as an externally owned account's wallet returns. */
export const isSignature = (value: unknown): value is Hex =>
  typeof value === "string" && SIGNATURE.test(value);

/** A 32-byte transaction hash. */
const isTransactionHash = (value: unknown): value is Hex =>
  typeof value === "string" && TRANSACTION_HASH.test(value);

/**
 * Whether `value` is a success value for `method`: a transaction hash for
 * `eth_sendTransaction`, a signature for everything else.
 */
export const isWalletResultValue = (
  value: unknown,
  method: WalletForwardingMethod
): value is Hex =>
  method === "eth_sendTransaction"
    ? isTransactionHash(value)
    : isSignature(value);

export function buildWalletResultDeepLink(
  scheme: DesktopScheme,
  result: WalletResult
): string {
  return `${scheme}://wallet?data=${encodeURIComponent(JSON.stringify(result))}`;
}

/**
 * Validate a returned result for a request of `method` (a signature, or a
 * transaction hash for `eth_sendTransaction`). The shell applies the same
 * rules and also matches the id to its live request.
 */
export function parseWalletResult(
  value: unknown,
  method: WalletForwardingMethod = "personal_sign"
): WalletResult | null {
  // Exactly the result's keys: every field is then bounded by its own
  // check, with no need to serialize untrusted input to measure it.
  if (!isRecord(value) || !hasResultKeys(value)) return null;
  const { v, id, ok } = value;
  if (
    v !== WALLET_FORWARDING_VERSION ||
    typeof id !== "string" ||
    !REQUEST_ID.test(id)
  ) {
    return null;
  }
  if (ok === true) {
    const result = value["value"];
    return isWalletResultValue(result, method)
      ? { v, id, ok, value: result.toLowerCase() as Hex }
      : null;
  }
  const code = value["code"];
  if (
    ok === false &&
    typeof code === "string" &&
    (WALLET_RESULT_FAILURES as readonly string[]).includes(code)
  ) {
    return { v, id, ok, code: code as WalletResultFailure };
  }
  return null;
}
