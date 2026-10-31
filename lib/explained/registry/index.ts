import { EDITION_FACTS, MEME_FAMILY } from "./editionFacts";
import { FEED_FACTS } from "./feedFacts";
import { MANIFEST_FACTS } from "./manifestFacts";
import { PROOF_FACTS } from "./proofFacts";
import { DECISION_FAMILY, RECORD_FACTS } from "./recordFacts";
import { SITE_FACTS } from "./siteFacts";
import type { FactFamily } from "./types";

/**
 * The facts registry: every value a 6529 Explained page may print, each
 * with its source (EXPLAINED.md §6.1, TDH-DESIGN.md §3). Adding a number to
 * a page starts here.
 */
export const FACT_REGISTRY = {
  ...FEED_FACTS,
  ...MANIFEST_FACTS,
  ...RECORD_FACTS,
  ...SITE_FACTS,
  ...EDITION_FACTS,
  ...PROOF_FACTS,
} as const;

export type StaticFactId = keyof typeof FACT_REGISTRY;

/** Facts keyed by a card or a decision number. */
export type FactFamilyId =
  | `meme.${number}.${"minted" | "edition" | "season" | "rate" | "firstMint"}`
  | `decision.D${number}`;

export const FACT_FAMILIES: readonly FactFamily[] = [
  MEME_FAMILY,
  DECISION_FAMILY,
];
