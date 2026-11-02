import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  formatCents,
  formatCount,
  formatRuntime,
  formatSignedCount,
  formatUtcClock,
  formatUtcDay,
  formatUtcInstant,
  formatUtcLongDay,
  formatUtcWeekday,
  shortCommit,
  shortHash,
} from "./format";
import type { FactInputs } from "./factInputs";
import {
  FACT_FAMILIES,
  FACT_REGISTRY,
  type FactFamilyId,
  type StaticFactId,
} from "./registry";
import type {
  FactDef,
  FactEvidence,
  FactFormat,
  FactSourceKind,
  FactStanding,
  FactUnit,
  FactValue,
} from "./registry/types";

/**
 * The facts layer (EXPLAINED.md §6.1). A page prints a number only through a
 * fact, and every fact carries its source and its time. An id the registry
 * does not know fails the typecheck, and, for the families keyed by a number
 * (`meme.562.edition`, `decision.D136`), fails at render, so the build fails.
 */
export type FactId = StaticFactId | FactFamilyId;
export type {
  FactEvidence,
  FactFormat,
  FactSourceKind,
  FactStanding,
  FactUnit,
  FactValue,
};

export interface FactSource {
  readonly kind: FactSourceKind;
  /** What it was read from: a file, an endpoint, a decision, a section. */
  readonly ref: string;
  /** The file or page, when it is public. */
  readonly url?: string;
  /** When this page read it. */
  readonly readAt?: string;
  /** When the source says it was written. */
  readonly writtenAt?: string;
  /** How often it is read again. */
  readonly refresh: string;
}

export interface Fact<T extends FactValue = FactValue> {
  readonly id: FactId;
  readonly value: T;
  readonly format: FactFormat;
  readonly unit?: FactUnit;
  readonly source: FactSource;
  readonly standing?: {
    readonly kind: FactStanding;
    readonly ref?: string;
  };
  readonly maturity?: "design" | "built" | "live";
  readonly evidence?: FactEvidence;
  /** Word for word from the source when it names one. */
  readonly limit?: string;
  /** A newer decision touches this value: which, and the fact holding the newer value. */
  readonly drift?: { readonly by: string; readonly says: FactId };
}

/** A fact whose source could not be read: the page shows that, never a number. */
export interface FactUnavailable {
  readonly id: FactId;
  readonly unavailable: true;
  readonly source: FactSource;
}

export type FactEntry = Fact | FactUnavailable;

export class UnknownFactError extends Error {
  constructor(id: string) {
    super(
      `Unknown fact "${id}": add it to lib/explained/registry before printing it.`
    );
    this.name = "UnknownFactError";
  }
}

export class FactUnavailableError extends Error {
  constructor(id: string, ref: string) {
    super(`Fact "${id}" is unavailable: ${ref} could not be read.`);
    this.name = "FactUnavailableError";
  }
}

export function isFact(entry: FactEntry | undefined): entry is Fact {
  return entry !== undefined && !("unavailable" in entry);
}

/** The serialisable set a page hands its client components. */
export interface FactSnapshot {
  readonly asOf: string;
  readonly facts: Readonly<Record<string, FactEntry>>;
}

function lookup(id: string): { def: FactDef; key: string } | null {
  const staticDef = (FACT_REGISTRY as Readonly<Record<string, FactDef>>)[id];
  if (staticDef) {
    return { def: staticDef, key: "" };
  }
  for (const family of FACT_FAMILIES) {
    const match = family.pattern.exec(id);
    if (match?.[1] !== undefined) {
      return { def: family.def(match[1]), key: match[1] };
    }
  }
  return null;
}

/** Whether an id names a fact the registry knows (its source may still be down). */
export function isKnownFactId(id: string): id is FactId {
  return lookup(id) !== null;
}

function resolveEntry(id: string, inputs: FactInputs): FactEntry {
  const found = lookup(id);
  if (!found) {
    throw new UnknownFactError(id);
  }
  const { def } = found;
  const source: FactSource = { ...def.source(inputs), refresh: def.refresh };
  const value = def.value(inputs);
  if (value === undefined) {
    return { id: id as FactId, unavailable: true, source };
  }
  const drift = def.drift?.(inputs);
  return {
    id: id as FactId,
    value,
    format: def.format,
    source,
    ...(def.unit === undefined ? {} : { unit: def.unit }),
    ...(def.standing === undefined ? {} : { standing: def.standing }),
    ...(def.maturity === undefined ? {} : { maturity: def.maturity }),
    ...(def.evidence === undefined ? {} : { evidence: def.evidence }),
    ...(def.limit === undefined ? {} : { limit: def.limit }),
    ...(drift === undefined
      ? {}
      : { drift: { by: drift.by, says: drift.says as FactId } }),
  };
}

/**
 * A page's facts, resolved from its inputs on the server. Static facts are
 * resolved at once; a family member (a card, a decision) when first asked
 * for. `snapshot()` is what the page passes to `FactsProvider`.
 */
export interface FactBook {
  /** The fact, or a thrown error if it is unknown or its source is down. */
  get<T extends FactValue = FactValue>(id: FactId): Fact<T>;
  /** The fact, or null when its source is down. Unknown ids still throw. */
  maybe<T extends FactValue = FactValue>(id: FactId): Fact<T> | null;
  /** A fact's raw value as text (a hash, a date): throws like `get`. */
  text(id: FactId): string;
  /** A fact's value as a number: throws like `get`, and if it is not one. */
  num(id: FactId): number;
  /** Every fact resolved so far, for the client and for "as JSON". */
  snapshot(): FactSnapshot;
}

export function createFactBook(inputs: FactInputs): FactBook {
  const entries = new Map<string, FactEntry>();
  for (const id of Object.keys(FACT_REGISTRY)) {
    entries.set(id, resolveEntry(id, inputs));
  }
  const entry = (id: FactId): FactEntry => {
    const known = entries.get(id);
    if (known) {
      return known;
    }
    const resolved = resolveEntry(id, inputs);
    entries.set(id, resolved);
    return resolved;
  };
  return {
    get<T extends FactValue>(id: FactId): Fact<T> {
      const found = entry(id);
      if (!isFact(found)) {
        throw new FactUnavailableError(id, found.source.ref);
      }
      return found as Fact<T>;
    },
    maybe<T extends FactValue>(id: FactId): Fact<T> | null {
      const found = entry(id);
      return isFact(found) ? (found as Fact<T>) : null;
    },
    text(id: FactId): string {
      return factText(this.get(id));
    },
    num(id: FactId): number {
      const { value } = this.get(id);
      if (typeof value !== "number") {
        throw new TypeError(`Fact "${id}" is not a number.`);
      }
      return value;
    },
    snapshot(): FactSnapshot {
      return { asOf: inputs.now, facts: Object.fromEntries(entries) };
    },
  };
}

/** Reads a fact from a snapshot (the client side of `FactBook.maybe`). */
export function factFromSnapshot<T extends FactValue = FactValue>(
  snapshot: FactSnapshot,
  id: FactId
): Fact<T> | null {
  const found = snapshot.facts[id];
  if (found === undefined) {
    if (!isKnownFactId(id)) {
      throw new UnknownFactError(id);
    }
    throw new Error(
      `Fact "${id}" was not resolved on the server: ask the FactBook for it before the snapshot is taken.`
    );
  }
  return isFact(found) ? (found as Fact<T>) : null;
}

export type FactStyle = "short" | "long";

function asNumber(value: FactValue): number {
  return typeof value === "number" ? value : Number(asText(value));
}

/** A fact's value as text: strings as they are, lists and records as JSON. */
function asText(value: FactValue): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value);
}

/** A fact's raw value as text (a hash, a date, a version), never localized. */
export function factText(fact: Fact): string {
  return asText(fact.value);
}

/**
 * Prints a fact as the pages print it: numbers by locale, dates in UTC,
 * hashes never localized. "short" is the running-text form ("Oct 18",
 * "0x63e242fa…163bcf22", "00:49 UTC"); "long" the full one ("October 18,
 * 2026", the whole hash, "2026-10-18 00:49:01 UTC").
 */
export function fmt(
  fact: Fact,
  locale: SupportedLocale,
  style: FactStyle = "short"
): string {
  const { value } = fact;
  switch (fact.format) {
    case "count":
      return formatCount(locale, asNumber(value));
    case "signedCount":
      return formatSignedCount(locale, asNumber(value));
    case "cents":
      return formatCents(locale, asNumber(value));
    case "hash":
      return style === "long" ? asText(value) : shortHash(asText(value));
    case "commit":
      return style === "long" ? asText(value) : shortCommit(asText(value));
    case "day":
      return style === "long"
        ? formatUtcLongDay(locale, asText(value))
        : formatUtcDay(locale, asText(value));
    case "weekday":
      return formatUtcWeekday(locale, asText(value));
    case "clock":
      return style === "long"
        ? formatUtcInstant(asText(value))
        : formatUtcClock(locale, asText(value));
    case "instant":
      return style === "long"
        ? formatUtcInstant(asText(value))
        : `${formatUtcDay(locale, asText(value))}, ${formatUtcClock(locale, asText(value))}`;
    case "runtime":
      return formatRuntime(locale, asNumber(value));
    case "list":
      return Array.isArray(value) ? String(value.length) : asText(value);
    case "text":
      return asText(value);
  }
}

/** "the public TDH feed, index.json · written 00:49 UTC · read 09:40 UTC" */
export function sourceLine(fact: FactEntry, locale: SupportedLocale): string {
  const parts = [fact.source.ref];
  if (fact.source.writtenAt) {
    parts.push(
      t(locale, "explained.kit.asOf.written", {
        time: formatUtcClock(locale, fact.source.writtenAt),
      })
    );
  }
  if (fact.source.readAt) {
    parts.push(
      t(locale, "explained.kit.asOf.read", {
        time: formatUtcClock(locale, fact.source.readAt),
      })
    );
  }
  return parts.join(" · ");
}

/** Every number's source, as JSON (the How-we-know action). */
export function factsAsJson(snapshot: FactSnapshot): string {
  const facts = Object.values(snapshot.facts).map((entry) =>
    isFact(entry)
      ? {
          id: entry.id,
          value: entry.value,
          ...(entry.unit === undefined ? {} : { unit: entry.unit }),
          source: entry.source,
          ...(entry.standing === undefined ? {} : { standing: entry.standing }),
          ...(entry.maturity === undefined ? {} : { maturity: entry.maturity }),
          ...(entry.evidence === undefined ? {} : { evidence: entry.evidence }),
          ...(entry.limit === undefined ? {} : { limit: entry.limit }),
          ...(entry.drift === undefined ? {} : { drift: entry.drift }),
        }
      : { id: entry.id, unavailable: true, source: entry.source }
  );
  return JSON.stringify({ asOf: snapshot.asOf, facts }, null, 2);
}
