/**
 * Wallet transactions for 6529 Desktop: matching a transaction to its rule
 * and applying the rule (arguments, value, risk).
 */

import { type Hex, stringToHex } from "viem";
import { readWalletMessageText } from "@/lib/desktop/wallet-forwarding/messageText";
import {
  type DecodedArgs,
  type DecodedTuple,
  type DecodedValue,
  decodeTransactionData,
} from "./decode";
import { WALLET_TRANSACTION_RULES } from "./rules";
import {
  type ArgRule,
  FROM,
  type RuleArg,
  type RuleLiteral,
  type TransactionRisk,
  type TransactionRule,
  type ValueRule,
} from "./types";

/** A transaction as forwarded: canonical lower-case hex, value in wei. */
interface WalletTransaction {
  readonly from: string;
  readonly to: string;
  readonly data: Hex;
  readonly value: bigint;
}

/** Why a transaction is not forwarded (fixed words, never data). */
type WalletTransactionProblem = "unknown-transaction" | "transaction-rule";

export type WalletTransactionCheck =
  | {
      readonly ok: true;
      readonly rule: TransactionRule;
      readonly args: DecodedArgs;
      readonly risk: TransactionRisk;
    }
  | { readonly ok: false; readonly problem: WalletTransactionProblem };

const ZERO_ADDRESS = `0x${"0".repeat(40)}`;
const ADDRESS = /^0x[0-9a-f]{40}$/;
const UTF8_ENCODER = new TextEncoder();
const READABLE_ASCII = /^[\x20-\x7e]{1,128}$/;

interface RuleContext {
  readonly from: string;
  readonly args: DecodedArgs;
  /** Inside `each`: the element index, for parallel arrays. */
  readonly index?: number;
}

const ZERO_HEX = /^0x(?:00)+$/;
const isBytesType = (type: string): boolean => type.startsWith("bytes");
const elementTypeOf = (type: string): string =>
  type.endsWith("[]") ? type.slice(0, -2) : type;

/** The rules for this chain, contract and selector (or plain value send). */
function findTransactionRule(
  chainId: number,
  to: string,
  data: Hex,
  rules: readonly TransactionRule[] = WALLET_TRANSACTION_RULES
): TransactionRule | null {
  const target = to.toLowerCase();
  const selector = data.length >= 10 ? data.slice(0, 10).toLowerCase() : null;
  return (
    rules.find(
      (rule) =>
        rule.chainId === chainId &&
        rule.to === target &&
        (rule.selector === null ? data === "0x" : rule.selector === selector)
    ) ?? null
  );
}

function matchesLiteral(
  value: DecodedValue,
  literal: RuleLiteral,
  from: string
): boolean {
  if (literal === FROM) return value === from;
  if (typeof literal === "boolean") return value === literal;
  if (typeof value === "bigint") {
    return /^\d+$/.test(literal) && BigInt(literal) === value;
  }
  return typeof value === "string" && value === literal.toLowerCase();
}

/** 0, the zero address, `false`, or fixed bytes that are all zero. */
function isZero(value: DecodedValue, type: string): boolean {
  if (value === 0n || value === false || value === ZERO_ADDRESS) return true;
  return (
    type !== "bytes" &&
    isBytesType(type) &&
    typeof value === "string" &&
    ZERO_HEX.test(value)
  );
}

/** Elements of an array, UTF-8 bytes of a string, bytes of `bytes(N)`. */
function lengthOf(value: DecodedValue, type: string): number | null {
  if (Array.isArray(value)) return value.length;
  if (typeof value !== "string") return null;
  if (isBytesType(type)) return (value.length - 2) / 2;
  if (type !== "string") return null;
  return UTF8_ENCODER.encode(value).length;
}

const isReadableText = (value: DecodedValue): boolean =>
  typeof value === "string" &&
  (value === "" || readWalletMessageText(stringToHex(value)) !== null);

function satisfiesUintBounds(value: DecodedValue, rule: ArgRule): boolean {
  if (rule.uintMin === undefined && rule.uintMax === undefined) return true;
  if (typeof value !== "bigint") return false;
  return (
    (rule.uintMin === undefined || value >= BigInt(rule.uintMin)) &&
    (rule.uintMax === undefined || value <= BigInt(rule.uintMax))
  );
}

function satisfiesLengthBounds(
  value: DecodedValue,
  rule: ArgRule,
  type: string
): boolean {
  if (rule.lenMin === undefined && rule.lenMax === undefined) return true;
  const length = lengthOf(value, type);
  if (length === null) return false;
  return (
    (rule.lenMin === undefined || length >= rule.lenMin) &&
    (rule.lenMax === undefined || length <= rule.lenMax)
  );
}

const satisfiesBounds = (
  value: DecodedValue,
  rule: ArgRule,
  type: string
): boolean =>
  satisfiesUintBounds(value, rule) && satisfiesLengthBounds(value, rule, type);

function satisfiesText(value: DecodedValue, rule: ArgRule): boolean {
  if (
    rule.readableAscii &&
    (typeof value !== "string" || !READABLE_ASCII.test(value))
  ) {
    return false;
  }
  if (rule.readableText && !isReadableText(value)) return false;
  if (rule.emptyBytes && value !== "0x") return false;
  return true;
}

function satisfiesLiterals(
  value: DecodedValue,
  rule: ArgRule,
  from: string,
  type: string
): boolean {
  if (rule.equals !== undefined && !matchesLiteral(value, rule.equals, from)) {
    return false;
  }
  if (
    rule.notEqual !== undefined &&
    matchesLiteral(value, rule.notEqual, from)
  ) {
    return false;
  }
  if (rule.notZero && isZero(value, type)) return false;
  if (
    rule.oneOf !== undefined &&
    !rule.oneOf.some((literal) => matchesLiteral(value, literal, from))
  ) {
    return false;
  }
  if (rule.noneOf?.some((literal) => matchesLiteral(value, literal, from))) {
    return false;
  }
  return true;
}

/** The named argument, read at the element index inside `each`. */
function relatedValue(
  name: string,
  context: RuleContext
): DecodedValue | undefined {
  const value = context.args[name];
  if (context.index !== undefined && Array.isArray(value)) {
    return (value as readonly DecodedValue[])[context.index];
  }
  return value;
}

function satisfiesRelations(
  value: DecodedValue,
  rule: ArgRule,
  context: RuleContext,
  type: string
): boolean {
  if (rule.sameLength !== undefined) {
    if (!Array.isArray(value)) return false;
    const ok = rule.sameLength.every((name) => {
      const other = context.args[name];
      return Array.isArray(other) && other.length === value.length;
    });
    if (!ok) return false;
  }
  if (rule.zeroIf !== undefined) {
    const other = relatedValue(rule.zeroIf.arg, context);
    if (
      other !== undefined &&
      matchesLiteral(other, rule.zeroIf.equals, context.from) &&
      value !== 0n
    ) {
      return false;
    }
  }
  if (rule.each !== undefined) {
    if (!Array.isArray(value)) return false;
    const each = rule.each;
    const elementType = elementTypeOf(type);
    return (value as readonly DecodedValue[]).every((element, index) =>
      satisfiesArgRule(element, each, { ...context, index }, elementType)
    );
  }
  return true;
}

/** Whether `value` (of ABI `type`) satisfies every key of `rule`. */
function satisfiesArgRule(
  value: DecodedValue,
  rule: ArgRule,
  context: RuleContext,
  type: string
): boolean {
  return (
    satisfiesLiterals(value, rule, context.from, type) &&
    satisfiesBounds(value, rule, type) &&
    satisfiesText(value, rule) &&
    satisfiesRelations(value, rule, context, type)
  );
}

const isTuple = (value: DecodedValue | undefined): value is DecodedTuple =>
  typeof value === "object" && !Array.isArray(value);

/** Every field of one decoded tuple against the components' rules. */
function satisfiesComponents(
  tuple: DecodedValue,
  components: readonly RuleArg[],
  context: RuleContext
): boolean {
  if (!isTuple(tuple)) return false;
  return components.every((component) => {
    const field = tuple[component.name];
    return field !== undefined && satisfiesArg(field, component, context);
  });
}

/** An argument (or tuple field): its rule, then its components' rules. */
function satisfiesArg(
  value: DecodedValue,
  arg: RuleArg,
  context: RuleContext
): boolean {
  if (!satisfiesArgRule(value, arg.rule, context, arg.type)) return false;
  const { components } = arg;
  if (components === undefined) return true;
  // Component rules see no element index: they cannot name other arguments.
  const fields: RuleContext = { from: context.from, args: context.args };
  if (!arg.type.endsWith("[]")) {
    return satisfiesComponents(value, components, fields);
  }
  return (
    Array.isArray(value) &&
    (value as readonly DecodedValue[]).every((element) =>
      satisfiesComponents(element, components, fields)
    )
  );
}

function satisfiesValue(
  value: bigint,
  rule: ValueRule,
  args: DecodedArgs
): boolean {
  if (value < BigInt(rule.min)) return false;
  if ("max" in rule) return value <= BigInt(rule.max);
  // `unitsArg` names a uint argument (the table test checks the name), and
  // strict decoding gives every uint as a bigint; anything else refuses.
  const units = args[rule.unitsArg];
  return typeof units === "bigint" && value <= BigInt(rule.maxPerUnit) * units;
}

function riskOf(
  rule: TransactionRule,
  value: bigint,
  context: RuleContext
): TransactionRisk {
  const { risk } = rule;
  if (typeof risk === "string") return risk;
  const high = risk.highIf.some((condition) => {
    if ("valueAbove" in condition) {
      return value > BigInt(condition.valueAbove);
    }
    const argValue = context.args[condition.arg];
    const type =
      rule.args.find((arg) => arg.name === condition.arg)?.type ?? "";
    if (argValue === undefined) return false;
    if (Array.isArray(argValue)) {
      const elementType = elementTypeOf(type);
      return (argValue as readonly DecodedValue[]).some((element, index) =>
        satisfiesArgRule(
          element,
          condition.is,
          { ...context, index },
          elementType
        )
      );
    }
    return satisfiesArgRule(argValue, condition.is, context, type);
  });
  return high ? "high" : "normal";
}

/**
 * Checks a transaction against the allow-list for `chainId`: a rule for
 * its contract and function must exist (`unknown-transaction`), and its
 * data must decode strictly, every argument pass its rule and the value
 * stay in bounds (`transaction-rule`). The sender must be lower-case.
 */
export function checkWalletTransaction(
  transaction: WalletTransaction,
  chainId: number,
  rules: readonly TransactionRule[] = WALLET_TRANSACTION_RULES
): WalletTransactionCheck {
  const { from, to, data, value } = transaction;
  if (!ADDRESS.test(from) || !ADDRESS.test(to)) {
    return { ok: false, problem: "transaction-rule" };
  }
  const rule = findTransactionRule(chainId, to, data, rules);
  if (!rule) return { ok: false, problem: "unknown-transaction" };
  const args = decodeTransactionData(rule, data);
  if (!args) return { ok: false, problem: "transaction-rule" };
  const context: RuleContext = { from, args };
  const argsOk = rule.args.every((arg) => {
    const argValue = args[arg.name];
    return argValue !== undefined && satisfiesArg(argValue, arg, context);
  });
  if (!argsOk || !satisfiesValue(value, rule.value, args)) {
    return { ok: false, problem: "transaction-rule" };
  }
  return { ok: true, rule, args, risk: riskOf(rule, value, context) };
}
