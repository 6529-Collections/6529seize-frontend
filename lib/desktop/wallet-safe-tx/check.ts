/**
 * Safe transactions for 6529 Desktop: checking a SafeTx message against
 * the pins and the governance rules, with MultiSend batches decoded.
 *
 * Accepted only:
 * - zero `value`, `safeTxGas`, `baseGas`, `gasPrice` (decimal strings
 *   "0"), zero `gasToken` and `refundReceiver`, `nonce` a decimal string up
 *   to 2^53-1;
 * - `operation` 0 (a call) to a registry the domain's Safe owns, with one
 *   governance call as `data`; or
 * - `operation` 1 (delegatecall) to the chain's MultiSendCallOnly with
 *   `multiSend(bytes)` as `data` (strictly encoded), whose packed calls
 *   (2 to 16) are all operation 0, value 0, to such a registry, each one
 *   governance call that may be batched.
 */

import { decodeFunctionData, encodeFunctionData, type Hex } from "viem";
import { checkWalletTransaction } from "@/lib/desktop/wallet-transactions/check";
import type { DecodedArgs } from "@/lib/desktop/wallet-transactions/decode";
import type {
  TransactionRisk,
  TransactionRule,
} from "@/lib/desktop/wallet-transactions/types";
import { governanceRules, SINGLE_CALL_ONLY } from "./governance-rules";
import {
  SAFE_TX_BATCH,
  SAFE_TX_FIELDS,
  SAFE_TX_PINS,
  type SafeTxPin,
} from "./pins";

/** One checked governance call. */
export interface SafeTxCall {
  /** Lower-case registry address. */
  readonly registry: string;
  readonly rule: TransactionRule;
  readonly args: DecodedArgs;
  readonly risk: TransactionRisk;
  /** A call that may only be signed on its own. */
  readonly singleCallOnly: boolean;
}

export type SafeTxCheck =
  | {
      readonly ok: true;
      readonly pin: SafeTxPin;
      readonly operation: 0 | 1;
      readonly nonce: bigint;
      readonly calls: readonly SafeTxCall[];
    }
  | { readonly ok: false; readonly problem: "safe-tx-rule" };

const FAIL = { ok: false, problem: "safe-tx-rule" } as const;
const ZERO_ADDRESS = `0x${"0".repeat(40)}`;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const HEX_DIGITS = /^0x[0-9a-fA-F]*$/;
/** `0x` and whole bytes, any case. */
const isHexBytes = (value: string): boolean =>
  HEX_DIGITS.test(value) && value.length % 2 === 0;
const NONCE = /^(?:0|[1-9]\d{0,15})$/;
const MAX_SAFE_NONCE = BigInt(Number.MAX_SAFE_INTEGER);

const MULTI_SEND = {
  type: "function",
  name: "multiSend",
  stateMutability: "payable",
  inputs: [{ name: "transactions", type: "bytes" }],
  outputs: [],
} as const;

/** The governance rules of every registry pinned to this Safe. */
const rulesFor = (pin: SafeTxPin): TransactionRule[] =>
  pin.registries.flatMap((registry) =>
    governanceRules(pin.chainId, registry.address)
  );

const isZeroAddress = (value: unknown): boolean =>
  typeof value === "string" &&
  ADDRESS.test(value) &&
  value.toLowerCase() === ZERO_ADDRESS;

/** The pin for this domain: exactly `{chainId, verifyingContract}`. */
function pinFor(domain: Readonly<Record<string, unknown>>): SafeTxPin | null {
  const keys = Object.keys(domain).sort();
  if (keys.join(",") !== "chainId,verifyingContract") return null;
  return (
    SAFE_TX_PINS.find(
      (pin) =>
        domain["chainId"] === pin.chainId &&
        domain["verifyingContract"] === pin.safe
    ) ?? null
  );
}

/** One governance call to a pinned registry of `pin`, or null. */
function checkCall(
  pin: SafeTxPin,
  to: string,
  data: Hex,
  rules: readonly TransactionRule[]
): SafeTxCall | null {
  const registry = to.toLowerCase();
  if (!pin.registries.some((item) => item.address === registry)) return null;
  const checked = checkWalletTransaction(
    { from: pin.safe.toLowerCase(), to: registry, data, value: 0n },
    pin.chainId,
    rules
  );
  if (!checked.ok) return null;
  return {
    registry,
    rule: checked.rule,
    args: checked.args,
    risk: checked.risk,
    singleCallOnly: SINGLE_CALL_ONLY.includes(checked.rule.id),
  };
}

/** A packed MultiSend transaction (before the rules). */
interface PackedCall {
  readonly operation: number;
  readonly to: string;
  readonly value: bigint;
  readonly data: Hex;
}

/**
 * The packed transactions of `multiSend(bytes)` call data: each
 * `uint8 operation | address to | uint256 value | uint256 length | bytes
 * data`, with nothing left over. Null when the call data is not exactly
 * the canonical encoding or the packed bytes do not parse.
 */
export function decodeMultiSend(data: Hex): PackedCall[] | null {
  let packed: Hex;
  try {
    const decoded = decodeFunctionData({ abi: [MULTI_SEND], data });
    packed = decoded.args[0];
    const again = encodeFunctionData({ abi: [MULTI_SEND], args: [packed] });
    if (again.toLowerCase() !== data.toLowerCase()) return null;
  } catch {
    return null;
  }
  const hex = packed.slice(2).toLowerCase();
  const calls: PackedCall[] = [];
  let at = 0;
  // 1 + 20 + 32 + 32 bytes of header per call, in hex digits.
  const HEADER = 2 + 40 + 64 + 64;
  while (at < hex.length) {
    if (hex.length - at < HEADER) return null;
    const operation = Number.parseInt(hex.slice(at, at + 2), 16);
    const to = `0x${hex.slice(at + 2, at + 42)}`;
    const value = BigInt(`0x${hex.slice(at + 42, at + 106)}`);
    const length = BigInt(`0x${hex.slice(at + 106, at + 170)}`);
    at += HEADER;
    if (length > BigInt((hex.length - at) / 2)) return null;
    const end = at + Number(length) * 2;
    calls.push({ operation, to, value, data: `0x${hex.slice(at, end)}` });
    at = end;
  }
  return calls;
}

function checkBatch(pin: SafeTxPin, data: Hex): SafeTxCall[] | null {
  const packed = decodeMultiSend(data);
  if (
    packed === null ||
    packed.length < SAFE_TX_BATCH.min ||
    packed.length > SAFE_TX_BATCH.max
  ) {
    return null;
  }
  const rules = rulesFor(pin);
  const calls: SafeTxCall[] = [];
  for (const item of packed) {
    if (item.operation !== 0 || item.value !== 0n) return null;
    const call = checkCall(pin, item.to, item.data, rules);
    if (call === null || call.singleCallOnly) return null;
    calls.push(call);
  }
  return calls;
}

/** Whether the message has exactly the SafeTx fields. */
const hasSafeTxFields = (message: Readonly<Record<string, unknown>>) => {
  const keys = Object.keys(message);
  return (
    keys.length === SAFE_TX_FIELDS.length &&
    SAFE_TX_FIELDS.every((field) => Object.hasOwn(message, field.name))
  );
};

/**
 * Checks a SafeTx message for `domain` (the request's typed data, whose
 * types already matched the SafeTx schema). Never throws.
 */
export function checkSafeTx(
  domain: Readonly<Record<string, unknown>>,
  message: Readonly<Record<string, unknown>>
): SafeTxCheck {
  try {
    const pin = pinFor(domain);
    if (pin === null || !hasSafeTxFields(message)) return FAIL;
    const { to, data, operation, nonce } = message;
    const zeroAmounts = ["value", "safeTxGas", "baseGas", "gasPrice"].every(
      (key) => message[key] === "0"
    );
    if (
      !zeroAmounts ||
      !isZeroAddress(message["gasToken"]) ||
      !isZeroAddress(message["refundReceiver"]) ||
      typeof to !== "string" ||
      !ADDRESS.test(to) ||
      typeof data !== "string" ||
      !isHexBytes(data) ||
      typeof nonce !== "string" ||
      !NONCE.test(nonce) ||
      BigInt(nonce) > MAX_SAFE_NONCE
    ) {
      return FAIL;
    }
    let calls: SafeTxCall[] | null = null;
    if (operation === 0) {
      const call = checkCall(pin, to, data as Hex, rulesFor(pin));
      calls = call === null ? null : [call];
    } else if (operation === 1 && to.toLowerCase() === pin.multiSendCallOnly) {
      calls = checkBatch(pin, data as Hex);
    }
    if (calls === null) return FAIL;
    return { ok: true, pin, operation, nonce: BigInt(nonce), calls };
  } catch {
    return FAIL;
  }
}
