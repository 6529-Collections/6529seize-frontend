import {
  baseTdh,
  cycleBoundary,
  dateOfCycleDay,
  finalTdh,
  wholeDays,
  DAY,
} from "@/components/explained/engine/tdh";
import type { TdhProfile } from "../tdh-profile.helpers";

/**
 * The arithmetic behind Explain my TDH (TDH-DESIGN.md §4.1 §03): the rows
 * of a record (copies × whole days × rate = base TDH, per card), its total
 * with the boost, whether the latest daily comparison included it, and
 * when a newly bought copy is first counted. Every value is the engine's
 * or the record's own; nothing here is typed by hand.
 */
export type Collection = "memes" | "gradients" | "nextgen";

export interface RecordRow {
  readonly collection: Collection;
  readonly id: string;
  /** The card's effective edition, when known (Memes). */
  readonly edition: number | null;
  readonly copies: number;
  /** Whole days held: one number when every copy has held as long, else a range. */
  readonly days: readonly [number] | readonly [number, number];
  /** The rate, in cents. */
  readonly rateCents: number;
  readonly base: number;
}

export interface RecordSummary {
  readonly rows: readonly RecordRow[];
  /** Cards beyond the rows shown, and their base TDH together. */
  readonly more: { readonly count: number; readonly base: number };
  readonly base: number;
  readonly boostCents: number;
  readonly total: number;
}

/** Rows of a record, the largest base first; at most `limit` shown. */
export function summarizeProfile(
  profile: TdhProfile,
  limit: number,
  editionOf: (collection: Collection, id: string) => number | null
): RecordSummary {
  const collections: Collection[] = ["memes", "gradients", "nextgen"];
  const rows: RecordRow[] = collections
    .flatMap((collection) =>
      profile[collection].map((token) => {
        const ages = token.days_held_per_edition;
        const min = ages.length > 0 ? Math.min(...ages) : 0;
        const max = ages.length > 0 ? Math.max(...ages) : 0;
        const days: RecordRow["days"] = min === max ? [min] : [min, max];
        return {
          collection,
          id: token.id,
          edition: editionOf(collection, token.id),
          copies: token.balance,
          days,
          rateCents: Math.round(token.hodl_rate * 100),
          base: token.tdh,
        };
      })
    )
    .filter((row) => row.copies > 0)
    .sort((a, b) => b.base - a.base);
  const shown = rows.slice(0, limit);
  const rest = rows.slice(limit);
  return {
    rows: shown,
    more: {
      count: rest.length,
      base: rest.reduce((sum, row) => sum + row.base, 0),
    },
    base: profile.tdh,
    boostCents: Math.round(profile.boost * 100),
    total: profile.boosted_tdh,
  };
}

export interface LatestComparison {
  readonly cutoff: number;
  readonly allEqual: boolean;
}

/**
 * Whether the latest daily comparison included this record: the same
 * snapshot block, and every identity equal in all three computations.
 */
export function includedIn(
  profile: TdhProfile,
  latest: LatestComparison | null
): boolean {
  return latest !== null && latest.allEqual && latest.cutoff === profile.block;
}

/** An example record: copies and whole days per card, at the cards' real rates. */
export function exampleSummary(
  holdings: readonly {
    readonly id: string;
    readonly edition: number;
    readonly copies: number;
    readonly days: number;
    readonly rateCents: number;
  }[],
  boostCents: number
): RecordSummary {
  const rows: RecordRow[] = holdings.map((holding) => ({
    collection: "memes",
    id: holding.id,
    edition: holding.edition,
    copies: holding.copies,
    days: [holding.days],
    rateCents: holding.rateCents,
    base: baseTdh(holding.rateCents, holding.copies * holding.days),
  }));
  const base = rows.reduce((sum, row) => sum + row.base, 0);
  return {
    rows,
    more: { count: 0, base: 0 },
    base,
    boostCents,
    total: finalTdh(base, boostCents),
  };
}

interface FirstCount {
  /** The first result after the copy arrived, which finds less than a day. */
  readonly gapDate: string;
  readonly gapMinutes: number;
  /** The first result that counts a whole day. */
  readonly firstDate: string;
}

/**
 * When a copy bought at `arrivedAt` is first counted (P26 §4.3): the
 * result dated N counts `days = (t_N − a) div 86,400`, so the first
 * snapshot after arrival finds less than a day, and the first result with
 * a whole day is the one that counts it.
 */
export function firstCount(arrivedAt: string): FirstCount {
  const a = Math.floor(Date.parse(arrivedAt) / 1000);
  const gapCycle = Math.floor(a / DAY) + 1;
  let firstCycle = gapCycle;
  while (wholeDays(cycleBoundary(firstCycle), a, DAY) < 1) {
    firstCycle += 1;
  }
  return {
    gapDate: dateOfCycleDay(gapCycle),
    gapMinutes: Math.round((cycleBoundary(gapCycle) - a) / 60),
    firstDate: dateOfCycleDay(firstCycle),
  };
}

/** A point in time as a share (0 to 1) of a window of whole days. */
export function shareOfWindow(
  at: string,
  fromDate: string,
  days: number
): number {
  const from = Date.parse(`${fromDate}T00:00:00Z`);
  const share = (Date.parse(at) - from) / (days * DAY * 1000);
  return Math.min(1, Math.max(0, share));
}
