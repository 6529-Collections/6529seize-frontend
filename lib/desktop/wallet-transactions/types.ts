/**
 * Wallet transactions for 6529 Desktop: the rule format.
 *
 * A transaction is forwarded to the browser wallet only when it matches a
 * rule: same chain, same contract (`to`), same function selector, call data
 * that decodes strictly by the rule's ABI, every argument passing its
 * argument rule, and a value inside the value rule. The rules are data
 * only, so 6529 Desktop can mirror them exactly; both sides apply the same
 * closed vocabulary below, and the canonical JSON of the table (see
 * `hash.ts`) proves they agree.
 */

/**
 * A literal in a rule: a uint as a decimal string, an address as
 * lower-case `0x` hex, a bool as a JSON boolean, or `$from` (the sender).
 */
export type RuleLiteral = string | boolean;

/** The sender's address, where a literal is expected. */
export const FROM = "$from";

/**
 * What an argument must satisfy. Every key present applies (logical and);
 * `{ any: true }` accepts any value of the argument's type.
 *
 * - `equals`, `notEqual`, `oneOf`: compare with literals.
 * - `notZero`: not the zero address, not 0.
 * - `uintMin`, `uintMax`: inclusive bounds for uints (decimal strings).
 * - `lenMin`, `lenMax`: element count of an array, UTF-8 byte length of
 *   a `string`.
 * - `readableAscii`: 1-128 printable ASCII characters.
 * - `readableText`: empty, or text a reader can check exactly (the rules
 *   the browser page applies to messages it shows).
 * - `emptyBytes`: `bytes` equal to `0x`.
 * - `sameLength`: an array with as many elements as each named argument.
 * - `each`: a rule every element of an array satisfies. Inside `each`, an
 *   argument named by `zeroIf` that is itself an array is read at the same
 *   index (parallel arrays).
 * - `zeroIf`: this uint is 0 when the named argument equals the literal.
 */
export interface ArgRule {
  readonly any?: true;
  readonly equals?: RuleLiteral;
  readonly notEqual?: RuleLiteral;
  readonly notZero?: true;
  readonly oneOf?: readonly RuleLiteral[];
  readonly uintMin?: string;
  readonly uintMax?: string;
  readonly lenMin?: number;
  readonly lenMax?: number;
  readonly readableAscii?: true;
  readonly readableText?: true;
  readonly emptyBytes?: true;
  readonly sameLength?: readonly string[];
  readonly each?: ArgRule;
  readonly zeroIf?: { readonly arg: string; readonly equals: RuleLiteral };
}

/** The keys an `ArgRule` may have; anything else makes the table invalid. */
export const ARG_RULE_KEYS = [
  "any",
  "equals",
  "notEqual",
  "notZero",
  "oneOf",
  "uintMin",
  "uintMax",
  "lenMin",
  "lenMax",
  "readableAscii",
  "readableText",
  "emptyBytes",
  "sameLength",
  "each",
  "zeroIf",
] as const;

/** ABI types a rule argument may have. */
export const RULE_ARG_TYPES = [
  "address",
  "bool",
  "uint16",
  "uint32",
  "uint256",
  "string",
  "address[]",
  "bool[]",
  "uint32[]",
  "uint256[]",
  "bytes32[]",
  "bytes32[][]",
] as const;

type RuleArgType = (typeof RULE_ARG_TYPES)[number];

export interface RuleArg {
  /** The ABI parameter name. */
  readonly name: string;
  readonly type: RuleArgType;
  readonly rule: ArgRule;
}

/**
 * The value in wei (decimal strings), inclusive: at least `min`, and at
 * most `max`, or at most `maxPerUnit` times the uint argument `unitsArg`.
 */
export type ValueRule =
  | { readonly min: string; readonly max: string }
  | {
      readonly min: string;
      readonly maxPerUnit: string;
      readonly unitsArg: string;
    };

/**
 * When a rule's transaction is high-impact: an argument satisfies a rule
 * (for an array, any element does), or the value exceeds a bound in wei.
 */
export type RiskCondition =
  | { readonly arg: string; readonly is: ArgRule }
  | { readonly valueAbove: string };

/** `normal`, `high`, or high when any listed condition holds. */
export type RiskRule =
  | "normal"
  | "high"
  | { readonly highIf: readonly RiskCondition[] };

export type TransactionRisk = "normal" | "high";

export interface TransactionRule {
  /** Stable name, used in vectors, logs and descriptions. */
  readonly id: string;
  readonly chainId: number;
  /** Lower-case contract address. */
  readonly to: string;
  /**
   * The 4-byte function selector and canonical signature, or both null
   * for a plain value transfer whose `data` must be `0x`.
   */
  readonly selector: string | null;
  readonly signature: string | null;
  readonly args: readonly RuleArg[];
  readonly value: ValueRule;
  readonly risk: RiskRule;
}
