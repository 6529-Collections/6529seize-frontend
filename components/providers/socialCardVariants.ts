/**
 * Closed sets that collection social cards may select. The card route renders
 * only these fixed values and backend lookups, never text from the query.
 */
export const COLLECTION_CARD_VARIANTS = ["add", "admin", "mint"] as const;

export type CollectionCardVariant = (typeof COLLECTION_CARD_VARIANTS)[number];

export const COLLECTION_CARD_VIEW_LABELS = [
  "About",
  "Art",
  "Artists",
  "Collections",
  "Display Center",
  "Distribution Plan",
  "Mint",
  "Provenance",
  "Rarity",
  "Trait Sets",
] as const;

export const findClosedCardValue = <const Allowed extends readonly string[]>(
  allowed: Allowed,
  value: string | null | undefined
): Allowed[number] | undefined =>
  allowed.find((candidate) => candidate === value);
