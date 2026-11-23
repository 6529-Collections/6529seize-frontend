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
  type AbiParameter,
  decodeFunctionData,
  encodeFunctionData,
  type Hex,
} from "viem";
import type { RuleArg, TransactionRule } from "./types";

/**
 * A decoded argument: addresses and bytes as lower-case hex, uints as
 * bigint, bools, strings, arrays of those, and tuples as records by field
 * name.
 */
export type DecodedValue =
  | string
  | bigint
  | boolean
  | readonly DecodedValue[]
  | DecodedTuple;

/** A decoded tuple: its fields by name. */
export interface DecodedTuple {
  readonly [field: string]: DecodedValue;
}

/** Decoded arguments by ABI parameter name. */
export type DecodedArgs = Readonly<Record<string, DecodedValue>>;

/** The function name of a canonical signature: `name(types)`. */
const functionName = (signature: string): string =>
  signature.slice(0, signature.indexOf("("));

const isTupleType = (type: string): boolean => type.startsWith("(");

/** The viem ABI parameter for a rule argument (tuples by their components). */
function abiParameter(arg: RuleArg): AbiParameter {
  if (!isTupleType(arg.type)) return { name: arg.name, type: arg.type };
  return {
    name: arg.name,
    type: arg.type.endsWith("[]") ? "tuple[]" : "tuple",
    components: (arg.components ?? []).map(abiParameter),
  };
}

function abiItem(rule: TransactionRule): AbiFunction | null {
  if (rule.signature === null) return null;
  return {
    type: "function",
    name: functionName(rule.signature),
    inputs: rule.args.map(abiParameter),
    outputs: [],
    stateMutability: "payable",
  };
}

/** A decoded tuple (viem gives named components as an object). */
function normalizeTuple(
  value: unknown,
  components: readonly RuleArg[]
): DecodedTuple {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Expected a tuple");
  }
  const record = value as Readonly<Record<string, unknown>>;
  const out: Record<string, DecodedValue> = Object.create(null) as Record<
    string,
    DecodedValue
  >;
  for (const component of components) {
    out[component.name] = normalize(
      record[component.name],
      component.type,
      component.components
    );
  }
  return out;
}

/**
 * A decoded value by its ABI type: addresses and bytes lower-cased, small
 * uints as bigint, strings exactly as decoded, tuples by field name.
 */
function normalize(
  value: unknown,
  type: string,
  components?: readonly RuleArg[]
): DecodedValue {
  if (type.endsWith("[]")) {
    if (!Array.isArray(value)) throw new TypeError("Expected an array");
    const elementType = type.slice(0, -2);
    return value.map((element) => normalize(element, elementType, components));
  }
  if (isTupleType(type)) return normalizeTuple(value, components ?? []);
  return normalizeAtom(value, type);
}

/** An atomic value: uints as bigint, bools, strings, lower-case hex. */
function normalizeAtom(value: unknown, type: string): DecodedValue {
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
      args[arg.name] = normalize(values[index], arg.type, arg.components);
    });
    return args;
  } catch {
    return null;
  }
}
