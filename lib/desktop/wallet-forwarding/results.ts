/** Wallet forwarding: the browser page's answer, returned through the app link. */

import type { Hex } from "viem";
import {
  type DesktopScheme,
  isRecord,
  REQUEST_ID,
  SIGNATURE,
  WALLET_FORWARDING_VERSION,
} from "./shared";

/** Why the browser page did not return a signature. */
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

export function buildWalletResultDeepLink(
  scheme: DesktopScheme,
  result: WalletResult
): string {
  return `${scheme}://wallet?data=${encodeURIComponent(JSON.stringify(result))}`;
}

/**
 * Validate a returned result. The shell applies the same rules and also
 * matches the id to its live request.
 */
export function parseWalletResult(value: unknown): WalletResult | null {
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
    return isSignature(result)
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
