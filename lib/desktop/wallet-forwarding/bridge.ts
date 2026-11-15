/** Wallet forwarding: the desktop shell's answers to the app page. */

import type { Hex } from "viem";
import { WALLET_RESULT_FAILURES, isSignature } from "./results";
import {
  isRecord,
  REQUEST_CODE,
  WALLET_FORWARDING_METHODS,
  type WalletForwardingMethod,
  WALLET_FORWARDING_VERSION,
} from "./shared";

/** Why the shell could not return a wallet answer to the app page. */
const WALLET_BRIDGE_FAILURES = [
  ...WALLET_RESULT_FAILURES,
  "cancelled",
  "expired",
  "busy",
  "invalid",
  "unsupported",
  "not-signed-in",
] as const;

type WalletBridgeFailure = (typeof WALLET_BRIDGE_FAILURES)[number];

const isBridgeFailure = (value: unknown): value is WalletBridgeFailure =>
  typeof value === "string" &&
  (WALLET_BRIDGE_FAILURES as readonly string[]).includes(value);

/** A fixed diagnostic word the shell may add to a failure; never data. */
const REASON = /^[a-z][a-z-]{0,39}$/;

/** The shell's answer to `window.desktopWallet.request(...)`. */
export type WalletBridgeResponse =
  | { readonly ok: true; readonly value: Hex }
  | {
      readonly ok: false;
      readonly code: WalletBridgeFailure;
      /** For example `unverified-signature`, `too-large`. */
      readonly reason?: string;
    };

/** Validate the shell's answer; anything unexpected counts as a failure. */
export function parseWalletBridgeResponse(
  value: unknown
): WalletBridgeResponse {
  if (isRecord(value) && value["ok"] === true) {
    const result = value["value"];
    return isSignature(result)
      ? { ok: true, value: result.toLowerCase() as Hex }
      : { ok: false, code: "failed" };
  }
  const code = isRecord(value) ? value["code"] : undefined;
  const reason = isRecord(value) ? value["reason"] : undefined;
  return {
    ok: false,
    code: isBridgeFailure(code) ? code : "failed",
    ...(typeof reason === "string" && REASON.test(reason) ? { reason } : {}),
  };
}

/**
 * The shell's `window.desktopWallet.status()` and `onStatusChange` payload:
 * whether a request is open, with the short code the browser page also
 * shows. The request id itself never reaches the app page.
 */
type WalletBridgeStatus =
  | { readonly pending: false }
  | {
      readonly pending: true;
      readonly requestCode: string;
      readonly method: WalletForwardingMethod;
      readonly expiresAt: number;
    };

/** Validate a shell status; anything unexpected reads as no open request. */
export function parseWalletBridgeStatus(value: unknown): WalletBridgeStatus {
  if (!isRecord(value) || value["pending"] !== true) return { pending: false };
  const { code, method, expiresAt } = value;
  return typeof code === "string" &&
    REQUEST_CODE.test(code) &&
    typeof method === "string" &&
    (WALLET_FORWARDING_METHODS as readonly string[]).includes(method) &&
    typeof expiresAt === "number" &&
    Number.isSafeInteger(expiresAt) &&
    expiresAt > 0
    ? {
        pending: true,
        requestCode: code,
        method: method as WalletForwardingMethod,
        expiresAt,
      }
    : { pending: false };
}

/**
 * The methods the shell forwards, from `window.desktopWallet.capabilities()`
 * (`{ version: 1, methods: [...] }`). Empty when the shell speaks another
 * version or names no method this website forwards.
 */
export function parseWalletBridgeCapabilities(
  value: unknown
): readonly WalletForwardingMethod[] {
  if (
    !isRecord(value) ||
    value["version"] !== WALLET_FORWARDING_VERSION ||
    !Array.isArray(value["methods"])
  ) {
    return [];
  }
  const offered: readonly unknown[] = value["methods"];
  return WALLET_FORWARDING_METHODS.filter((method) => offered.includes(method));
}

/**
 * Whether the shell accepts a `personal_sign` request's `context` (from
 * `capabilities()`: `{ version: 1, methods, context: true }`). A shell that
 * does not say so refuses unknown keys, so the app sends it no context.
 */
export function walletBridgeAcceptsContext(value: unknown): boolean {
  return (
    isRecord(value) &&
    value["version"] === WALLET_FORWARDING_VERSION &&
    value["context"] === true
  );
}
