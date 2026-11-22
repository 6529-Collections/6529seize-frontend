/**
 * Wallet transactions for 6529 Desktop: strict call-data decoding.
 *
 * Call data is decoded by the rule's ABI and then encoded again; only data
 * equal byte for byte to its own re-encoding is accepted. That refuses
 * dirty padding, non-canonical offsets, out-of-range small integers and
 * trailing bytes, so what is shown is exactly what is sent.
 */

import {
  type AbiFunction,
  decodeFunctionData,
  encodeFunctionData,
  type Hex,
} from "viem";
import type { TransactionRule } from "./types";

/**
 * A decoded argument: addresses and fixed bytes as lower-case hex, uints
 * as bigint, bools, strings, and arrays of those.
 */
export type DecodedValue = string | bigint | boolean | readonly DecodedValue[];

/** Decoded arguments by ABI parameter name. */
export type DecodedArgs = Readonly<Record<string, DecodedValue>>;

/** The function name of a canonical signature: `name(types)`. */
const functionName = (signature: string): string =>
  signature.slice(0, signature.indexOf("("));

function abiItem(rule: TransactionRule): AbiFunction | null {
  if (rule.signature === null) return null;
  return {
    type: "function",
    name: functionName(rule.signature),
    inputs: rule.args.map(({ name, type }) => ({ name, type })),
    outputs: [],
    stateMutability: "payable",
  };
}

/**
 * A decoded value by its ABI type: addresses and fixed bytes lower-cased,
 * small uints as bigint, strings exactly as decoded.
 */
function normalize(value: unknown, type: string): DecodedValue {
  if (type.endsWith("[]")) {
    if (!Array.isArray(value)) throw new TypeError("Expected an array");
    const elementType = type.slice(0, -2);
    return value.map((element) => normalize(element, elementType));
  }
  if (type.startsWith("uint")) {
    if (typeof value === "number") return BigInt(value);
    if (typeof value === "bigint") return value;
  } else if (type === "bool") {
    if (typeof value === "boolean") return value;
  } else if (type === "string") {
    if (typeof value === "string") return value;
  } else if (typeof value === "string") {
    return value.toLowerCase();
  }
  throw new TypeError("Unexpected decoded value");
}

/**
 * The arguments of `data` for `rule`, or null when it does not decode
 * strictly. For a rule without a function, only `0x` is accepted.
 */
export function decodeTransactionData(
  rule: TransactionRule,
  data: Hex
): DecodedArgs | null {
  const item = abiItem(rule);
  if (!item) return data === "0x" ? {} : null;
  try {
    const decoded = decodeFunctionData({ abi: [item], data });
    const values: readonly unknown[] = decoded.args;
    const encoded = encodeFunctionData({
      abi: [item],
      functionName: item.name,
      args: values,
    });
    if (encoded.toLowerCase() !== data.toLowerCase()) return null;
    if (values.length !== rule.args.length) return null;
    const args: Record<string, DecodedValue> = Object.create(null) as Record<
      string,
      DecodedValue
    >;
    rule.args.forEach((arg, index) => {
      args[arg.name] = normalize(values[index], arg.type);
    });
    return args;
  } catch {
    return null;
  }
}
