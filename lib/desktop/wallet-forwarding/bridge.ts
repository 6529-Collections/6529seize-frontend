/** Wallet forwarding: the desktop shell's answers to the app page. */

import type { Hex } from "viem";
import { walletTransactionRulesHash } from "@/lib/desktop/wallet-transactions/hash";
import { isWalletResultValue, WALLET_RESULT_FAILURES } from "./results";
import {
  isRecord,
  REQUEST_CODE,
  TRANSACTION_HASH,
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
  /** The wallet reported a transaction the shell could not confirm yet. */
  "unverified",
] as const;

type WalletBridgeFailure = (typeof WALLET_BRIDGE_FAILURES)[number];

const isBridgeFailure = (value: unknown): value is WalletBridgeFailure =>
  typeof value === "string" &&
  (WALLET_BRIDGE_FAILURES as readonly string[]).includes(value);

/** A fixed diagnostic word the shell may add to a failure; never data. */
const REASON = /^[a-z][a-z-]{0,39}$/;

/**
 * The failures that carry the hash the wallet reported: `unverified` (the
 * shell could not see the transaction in time, or could not reach a node)
 * and `failed` with `transaction-mismatch` (the transaction on chain is not
 * the one requested). The hash is public chain data, never request data.
 */
const HASH_REASONS: Readonly<Record<string, WalletBridgeFailure>> = {
  "transaction-not-visible": "unverified",
  "rpc-unavailable": "unverified",
  "transaction-mismatch": "failed",
};

/** The shell's answer to `window.desktopWallet.request(...)`. */
export type WalletBridgeResponse =
  | { readonly ok: true; readonly value: Hex }
  | {
      readonly ok: false;
      readonly code: WalletBridgeFailure;
      /** For example `unverified-signature`, `too-large`. */
      readonly reason?: string;
      /** Only with the reasons in `HASH_REASONS`. */
      readonly transactionHash?: Hex;
    };

/**
 * The reported hash: kept with the reasons in `HASH_REASONS`, and with any
 * other failure of a transaction request, so a hash the wallet returned is
 * never dropped (the app then shows it and asks the user to check it
 * before trying again).
 */
function readTransactionHash(
  code: WalletBridgeFailure,
  reason: string | undefined,
  value: unknown,
  method: WalletForwardingMethod
): Hex | undefined {
  const expected = reason !== undefined && HASH_REASONS[reason] === code;
  if (!expected && method !== "eth_sendTransaction") return undefined;
  return typeof value === "string" && TRANSACTION_HASH.test(value)
    ? (value.toLowerCase() as Hex)
    : undefined;
}

/**
 * Validate the shell's answer to a request of `method`: a signature, or a
 * transaction hash for `eth_sendTransaction`. Anything unexpected counts
 * as a failure; a transaction failure keeps any valid reported hash.
 */
export function parseWalletBridgeResponse(
  value: unknown,
  method: WalletForwardingMethod = "personal_sign"
): WalletBridgeResponse {
  if (isRecord(value) && value["ok"] === true) {
    const result = value["value"];
    return isWalletResultValue(result, method)
      ? { ok: true, value: result.toLowerCase() as Hex }
      : { ok: false, code: "failed" };
  }
  const record = isRecord(value) ? value : {};
  const rawCode = record["code"];
  const rawReason = record["reason"];
  const code = isBridgeFailure(rawCode) ? rawCode : "failed";
  const reason =
    typeof rawReason === "string" && REASON.test(rawReason)
      ? rawReason
      : undefined;
  const transactionHash = readTransactionHash(
    code,
    reason,
    record["transactionHash"],
    method
  );
  return {
    ok: false,
    code,
    ...(reason === undefined ? {} : { reason }),
    ...(transactionHash === undefined ? {} : { transactionHash }),
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
 * Whether the shell sends transactions with exactly this website's rules:
 * `capabilities()` lists `eth_sendTransaction` and reports
 * `transactionRules` equal to the SHA-256 of this website's canonical rule
 * table. A shell without them, or with other rules, is sent no transaction.
 */
export function walletBridgeSendsTransactions(value: unknown): boolean {
  return (
    isRecord(value) &&
    value["version"] === WALLET_FORWARDING_VERSION &&
    Array.isArray(value["methods"]) &&
    (value["methods"] as readonly unknown[]).includes("eth_sendTransaction") &&
    value["transactionRules"] === walletTransactionRulesHash()
  );
}

/**
 * The methods the shell forwards, from `window.desktopWallet.capabilities()`
 * (`{ version: 1, methods: [...], transactionRules? }`). Empty when the
 * shell speaks another version or names no method this website forwards;
 * `eth_sendTransaction` only when `walletBridgeSendsTransactions` holds.
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
  const sendsTransactions = walletBridgeSendsTransactions(value);
  return WALLET_FORWARDING_METHODS.filter(
    (method) =>
      offered.includes(method) &&
      (method !== "eth_sendTransaction" || sendsTransactions)
  );
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
