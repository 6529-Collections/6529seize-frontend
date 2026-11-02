import type { FactInputs } from "../factInputs";

/** The building blocks of a fact definition (EXPLAINED.md §6.1). */
export type FactValue =
  | number
  | string
  | boolean
  | null
  | readonly FactValue[]
  | { readonly [key: string]: FactValue };

export type FactUnit =
  | "TDH"
  | "identities"
  | "wallets"
  | "days"
  | "copies"
  | "cards"
  | "decisions"
  | "theorems"
  | "vectors"
  | "checks"
  | "bytes"
  | "seasons"
  | "minutes"
  | "ETH"
  | "UTC";

/**
 * Where a value comes from: the public feed, the Lean manifest, 6529.io's
 * API, the decision record, the specification, values read from 6529.io
 * and other records, the engine on the rule registry, or a constructed
 * example (always shown with its Example tag).
 */
export type FactSourceKind =
  | "feed"
  | "manifest"
  | "api"
  | "decision"
  | "spec"
  | "site"
  | "engine"
  | "example";

export type FactStanding = "decided" | "absolute" | "proposed" | "open";
export type FactEvidence =
  | "proved"
  | "tested"
  | "shownFalse"
  | "notGuaranteed"
  | "notYet";

/**
 * How a value prints: a count, a signed change, a rate or boost to the cent,
 * a hash or commit (shortened in running text), a UTC day, weekday, clock
 * time or instant, a run time, plain text, or a list.
 */
export type FactFormat =
  | "count"
  | "signedCount"
  | "cents"
  | "hash"
  | "commit"
  | "day"
  | "weekday"
  | "clock"
  | "instant"
  | "runtime"
  | "text"
  | "list";

export interface FactSourceRead {
  readonly kind: FactSourceKind;
  readonly ref: string;
  readonly url?: string;
  readonly readAt?: string;
  readonly writtenAt?: string;
}

export interface FactDef<T extends FactValue = FactValue> {
  readonly format: FactFormat;
  readonly unit?: FactUnit;
  /** How often the value is read again: "feed cache (10 min)", "build". */
  readonly refresh: string;
  readonly source: (inputs: FactInputs) => FactSourceRead;
  /** The value, or undefined when its source could not be read. */
  readonly value: (inputs: FactInputs) => T | undefined;
  readonly standing?: { readonly kind: FactStanding; readonly ref?: string };
  readonly maturity?: "design" | "built" | "live";
  readonly evidence?: FactEvidence;
  readonly limit?: string;
  /**
   * A newer decision that changes this value: the decision, and the id of
   * the fact that holds the newer value (checked by the facts tests).
   */
  readonly drift?: (
    inputs: FactInputs
  ) => { readonly by: string; readonly says: string } | undefined;
}

/** Facts keyed by a number: a card, a decision. */
export interface FactFamily {
  /** The id pattern; its first group is the key. */
  readonly pattern: RegExp;
  readonly def: (key: string) => FactDef;
}

/** Defines a fact with its value type checked. */
export function defineFact<T extends FactValue>(def: FactDef<T>): FactDef<T> {
  return def;
}
