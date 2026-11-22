/**
 * Wallet transactions for 6529 Desktop: what the browser page shows for an
 * allowed transaction. Everything comes from the checked transaction and
 * the rule table; nothing is taken from the requester.
 */

import type { DecodedArgs, DecodedValue } from "./decode";
import type { WalletTransactionCheck } from "./check";
import type { TransactionRisk } from "./types";

/** The contract groups a rule belongs to, by its id prefix. */
export type TransactionContractKind =
  | "delegation"
  | "memes"
  | "nextgen"
  | "subscriptions";

/** A high-impact effect the page names before Send. */
export type TransactionEffect =
  | {
      readonly kind: "delegate";
      readonly delegate: string;
      readonly useCase: string;
    }
  | { readonly kind: "onBehalfOf"; readonly delegator: string }
  | { readonly kind: "recipient"; readonly recipient: string }
  | { readonly kind: "mintAsDelegate"; readonly delegator: string }
  | { readonly kind: "largeValue" };

export interface DescribedTransactionArg {
  readonly name: string;
  readonly type: string;
  readonly value: DecodedValue;
}

export interface TransactionDescription {
  readonly ruleId: string;
  readonly chainId: number;
  readonly contract: TransactionContractKind;
  /** Lower-case contract address. */
  readonly to: string;
  /** The function name, or null for a plain value transfer. */
  readonly functionName: string | null;
  readonly args: readonly DescribedTransactionArg[];
  /** Wei. */
  readonly value: bigint;
  readonly risk: TransactionRisk;
  readonly effects: readonly TransactionEffect[];
  /** Cards or tokens minted, or delegations in a batch, when the call has a count. */
  readonly count: bigint | null;
}

const ZERO_ADDRESS = `0x${"0".repeat(40)}`;
/** Use cases that let the delegate act broadly or move TDH. */
const HIGH_IMPACT_USE_CASES = new Set([1n, 2n, 3n, 17n, 997n, 998n, 999n]);

const asString = (value: DecodedValue | undefined): string | null =>
  typeof value === "string" ? value : null;
const asBigint = (value: DecodedValue | undefined): bigint | null =>
  typeof value === "bigint" ? value : null;
const asArray = (value: DecodedValue | undefined): readonly DecodedValue[] =>
  Array.isArray(value) ? (value as readonly DecodedValue[]) : [];

function delegationEffects(
  args: DecodedArgs,
  from: string
): TransactionEffect[] {
  const effects: TransactionEffect[] = [];
  const delegator = asString(args["_delegatorAddress"]);
  if (delegator !== null && delegator !== from) {
    effects.push({ kind: "onBehalfOf", delegator });
  }
  const delegates = asArray(args["_delegationAddresses"]);
  const useCases = asArray(args["_useCases"]);
  const pairs: [DecodedValue | undefined, DecodedValue | undefined][] =
    delegates.length > 0
      ? delegates.map((delegate, index) => [delegate, useCases[index]])
      : [
          [
            args["_delegationAddress"] ?? args["_newdelegationAddress"],
            args["_useCase"],
          ],
        ];
  for (const [delegate, useCase] of pairs) {
    const address = asString(delegate);
    const id = asBigint(useCase);
    if (address !== null && id !== null && HIGH_IMPACT_USE_CASES.has(id)) {
      effects.push({
        kind: "delegate",
        delegate: address,
        useCase: String(id),
      });
    }
  }
  return effects;
}

function mintEffects(args: DecodedArgs, from: string): TransactionEffect[] {
  const effects: TransactionEffect[] = [];
  const recipient = asString(args["mintFor"] ?? args["_mintTo"]);
  if (recipient !== null && recipient !== from) {
    effects.push({ kind: "recipient", recipient });
  }
  const delegator = asString(args["_delegator"]);
  if (delegator !== null && delegator !== ZERO_ADDRESS) {
    effects.push({ kind: "mintAsDelegate", delegator });
  }
  return effects;
}

function countOf(args: DecodedArgs): bigint | null {
  const count =
    asBigint(args["mintCount"]) ?? asBigint(args["_numberOfTokens"]);
  if (count !== null) return count;
  const batch = args["_collectionAddresses"];
  return Array.isArray(batch) ? BigInt(batch.length) : null;
}

/**
 * The page's view of an allowed transaction (`check` must be ok). Effects
 * are listed for high-impact transactions only.
 */
export function describeWalletTransaction(
  check: Extract<WalletTransactionCheck, { ok: true }>,
  from: string,
  value: bigint
): TransactionDescription {
  const { rule, args, risk } = check;
  const contract = rule.id.split(".")[0] as TransactionContractKind;
  let effects: TransactionEffect[] = [];
  if (risk === "high") {
    if (contract === "delegation") effects = delegationEffects(args, from);
    else if (contract === "subscriptions") effects = [{ kind: "largeValue" }];
    else effects = mintEffects(args, from);
  }
  // A batch can repeat an effect; each is listed once (and keyed by it).
  const uniqueEffects = [
    ...new Map(
      effects.map((effect) => [JSON.stringify(effect), effect])
    ).values(),
  ];
  return {
    ruleId: rule.id,
    chainId: rule.chainId,
    contract,
    to: rule.to,
    functionName:
      rule.signature === null
        ? null
        : rule.signature.slice(0, rule.signature.indexOf("(")),
    args: rule.args.map(({ name, type }) => ({
      name,
      type,
      value: args[name] as DecodedValue,
    })),
    value,
    risk,
    effects: uniqueEffects,
    // A single Memes mint has no count argument.
    count: rule.id === "memes.mint" ? 1n : countOf(args),
  };
}
