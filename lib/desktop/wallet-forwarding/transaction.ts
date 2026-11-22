/** Wallet forwarding: `eth_sendTransaction` requests. */

import type { Hex } from "viem";
import {
  fail,
  INVALID_PARAMS,
  isRecord,
  MAX_TRANSACTION_DATA_BYTES,
  type Parsed,
  TOO_LARGE,
  WALLET_TRANSACTION_KEYS,
  type WalletRequest,
  type WalletRequestBase,
  type WalletRequestProblem,
  type WalletTransactionParams,
  WRONG_ADDRESS,
} from "./shared";

const CANONICAL_ADDRESS = /^0x[0-9a-f]{40}$/;
const CANONICAL_HEX = /^0x[0-9a-f]*$/;
const ANY_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const ANY_HEX = /^0x[0-9a-fA-F]*$/;
const ANY_QUANTITY = /^0x[0-9a-fA-F]{1,64}$/;

/** `0x` and whole bytes, lower-case. */
const isCanonicalData = (value: string): boolean =>
  CANONICAL_HEX.test(value) && value.length % 2 === 0;

/** A minimal lower-case hex quantity of at most 256 bits (`0x0`, `0x1e`). */
const isCanonicalQuantity = (value: string): boolean =>
  CANONICAL_HEX.test(value) &&
  value.length >= 3 &&
  value.length <= 66 &&
  (value === "0x0" || !value.startsWith("0x0"));

/** `0x` and whole bytes, any case. */
const isData = (value: string): boolean =>
  ANY_HEX.test(value) && value.length % 2 === 0;

const hasKeysInOrder = (
  value: Record<string, unknown>,
  keys: readonly string[]
): boolean => {
  const own = Object.keys(value);
  return (
    own.length === keys.length && own.every((key, index) => key === keys[index])
  );
};

const dataBytes = (data: string): number => (data.length - 2) / 2;

/**
 * A transaction request's params as the shell and the browser page accept
 * them: one object in canonical form (see `WalletTransactionParams`) whose
 * `from` is the request's address. Anything else (another key such as
 * `gas` or `nonce`, upper-case hex, padded quantities, no `to`) is
 * refused, never adjusted.
 */
export function parseTransactionRequest(
  params: readonly unknown[],
  base: WalletRequestBase
): Parsed<WalletRequest, WalletRequestProblem> {
  const [transaction] = params;
  if (
    params.length !== 1 ||
    !isRecord(transaction) ||
    !hasKeysInOrder(transaction, WALLET_TRANSACTION_KEYS)
  ) {
    return fail(INVALID_PARAMS);
  }
  const { from, to, data, value } = transaction;
  if (
    typeof from !== "string" ||
    typeof to !== "string" ||
    typeof data !== "string" ||
    typeof value !== "string" ||
    !CANONICAL_ADDRESS.test(from) ||
    !CANONICAL_ADDRESS.test(to) ||
    !isCanonicalData(data) ||
    !isCanonicalQuantity(value)
  ) {
    return fail(INVALID_PARAMS);
  }
  if (from !== base.address.toLowerCase()) return fail(WRONG_ADDRESS);
  if (dataBytes(data) > MAX_TRANSACTION_DATA_BYTES) return fail(TOO_LARGE);
  return {
    ok: true,
    value: {
      ...base,
      method: "eth_sendTransaction",
      transaction: { from, to, data: data as Hex, value: value as Hex },
    },
  };
}

/** The keys a wallet library may send for a plain call; nothing else. */
const LIBRARY_KEYS = new Set(["from", "to", "data", "value"]);

/**
 * The canonical transaction for what a wallet library sends as the single
 * `eth_sendTransaction` param (viem sends `{ from, to, data?, value? }`):
 * hex lower-cased, absent `data` as `0x`, absent `value` as `0x0`, the
 * value's leading zeros dropped. Null when it has any other key (gas,
 * fees, nonce, type, access or authorization lists, chain id), no `to`,
 * or a `from` other than `address`.
 */
export function toCanonicalTransaction(
  value: unknown,
  address: string
): WalletTransactionParams | null {
  if (!isRecord(value)) return null;
  if (Object.keys(value).some((key) => !LIBRARY_KEYS.has(key))) return null;
  const { from, to, data = "0x", value: amount = "0x0" } = value;
  if (
    typeof from !== "string" ||
    typeof to !== "string" ||
    typeof data !== "string" ||
    typeof amount !== "string" ||
    !ANY_ADDRESS.test(from) ||
    !ANY_ADDRESS.test(to) ||
    !isData(data) ||
    !ANY_QUANTITY.test(amount) ||
    from.toLowerCase() !== address.toLowerCase()
  ) {
    return null;
  }
  return {
    from: from.toLowerCase(),
    to: to.toLowerCase(),
    data: data.toLowerCase() as Hex,
    value: `0x${BigInt(amount).toString(16)}`,
  };
}
