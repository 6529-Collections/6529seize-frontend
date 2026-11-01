import type { FormalManifest } from "@/lib/tdh/formal/manifest";
import type {
  VerificationDay,
  VerificationIndex,
} from "@/lib/tdh/verification/schema";
import record from "./data/record.json";
import site from "./data/site.json";
import type { EngineAdapter } from "./engine";

/**
 * Everything a page's facts are read from (EXPLAINED.md §6.1). Live sources
 * are null when they could not be read; their facts are then unavailable
 * and the page says so, never a stale or typed number.
 */
export type RecordSnapshot = typeof record;
export type SiteSnapshot = typeof site;

export interface FeedDayInput {
  readonly day: VerificationDay;
  /** SHA-256 of the file's bytes as this server read them, when read. */
  readonly sha256: string | null;
  readonly url: string;
}

export interface FeedInput {
  readonly index: VerificationIndex;
  readonly indexUrl: string;
  readonly readAt: string;
  readonly latest: FeedDayInput;
  readonly previous: FeedDayInput | null;
  /**
   * Every day file the page read, when it read them all (the ribbon marks a
   * file rewritten after its run, which only the file itself says).
   */
  readonly days?: readonly FeedDayInput[];
}

export interface ManifestInput {
  readonly manifest: FormalManifest;
  /** Where it was read; null for the copy bundled with the site. */
  readonly url: string | null;
  readonly sha256: string | null;
  readonly readAt: string;
}

export interface EditionCard {
  readonly id: number;
  readonly season: number;
  /** Copies minted so far. */
  readonly minted: number;
  /** The first mint, UTC, when the source gives it. */
  readonly firstMint: string | null;
  /** 6529.io's scaled image of the card, when the source gives it. */
  readonly art?: string | null;
  /**
   * The edition 6529.io's own TDH counts (its `edition_size_floor`): the
   * minted count, or the claim's floor below 300 minted. It stands in for a
   * claim limit the facts layer has not recorded (P26 §5.2).
   */
  readonly edition?: number | null;
}

export interface EditionsInput {
  readonly cards: readonly EditionCard[];
  readonly readAt: string;
  readonly source: string;
  /** A card's claim limit, where it matters: below 300 minted (P26 §5.2). */
  readonly claimLimits: Readonly<Record<string, number>>;
}

export interface FactInputs {
  /** When the page read its sources (its render time). */
  readonly now: string;
  readonly feed: FeedInput | null;
  readonly manifest: ManifestInput | null;
  readonly editions: EditionsInput | null;
  readonly record: RecordSnapshot;
  readonly site: SiteSnapshot;
  readonly engine: EngineAdapter;
}

export const RECORD: RecordSnapshot = record;
export const SITE: SiteSnapshot = site;
