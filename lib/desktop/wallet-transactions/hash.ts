/**
 * Wallet transactions for 6529 Desktop: the canonical form of the rules.
 *
 * Canonical JSON: UTF-8, no whitespace, object keys sorted by code unit,
 * arrays in order, rules sorted by `id`, `chainId`, then `to`, wrapped as
 * `{"rules":[...],"v":1}`. 6529 Desktop keeps the same table and reports
 * the SHA-256 of this text as `transactionRules` in its capabilities; the
 * website forwards transactions only when the two hashes are equal.
 */

import { sha256 } from "viem";
import { WALLET_TRANSACTION_RULES } from "./rules";
import type { TransactionRule } from "./types";

/** Format version of the canonical rules JSON. */
const RULES_FORMAT_VERSION = 1;

/** Orders strings by UTF-16 code unit, as `Array.prototype.sort` does. */
const byCodeUnit = (a: string, b: string): number => {
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort(byCodeUnit)) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Canonical JSON of any plain value: keys sorted by code unit at every
 * level, arrays in order, no whitespace (the form 6529 Desktop rebuilds).
 */
export const canonicalJson = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

/** The canonical JSON text of a rule table. */
export function canonicalTransactionRulesJson(
  rules: readonly TransactionRule[] = WALLET_TRANSACTION_RULES
): string {
  const ordered = [...rules].sort(
    (a, b) =>
      byCodeUnit(a.id, b.id) || a.chainId - b.chainId || byCodeUnit(a.to, b.to)
  );
  return canonicalJson({ v: RULES_FORMAT_VERSION, rules: ordered });
}

/** SHA-256 of the canonical JSON, as 64 lower-case hex digits. */
export function transactionRulesHash(
  rules: readonly TransactionRule[] = WALLET_TRANSACTION_RULES
): string {
  const bytes = new TextEncoder().encode(canonicalTransactionRulesJson(rules));
  return sha256(bytes).slice(2);
}

let ownHash: string | null = null;

/**
 * The hash of this website's rules, which 6529 Desktop must report.
 * Computed once, on first use.
 */
export function walletTransactionRulesHash(): string {
  ownHash ??= transactionRulesHash();
  return ownHash;
}
