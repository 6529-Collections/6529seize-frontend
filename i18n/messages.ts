import { SortDirection } from "@/entities/ISort";

export const TAB_TOGGLE_WITH_OVERFLOW_MESSAGES = {
  overflowFallbackLabel: "More",
  overflowMenuAriaLabel: "More tabs",
} as const;

export const RECEIVED_RESULT_SUMMARY_MESSAGES = {
  sortedByLabel: "Sorted by",
  directionLabels: {
    [SortDirection.ASC]: "ascending",
    [SortDirection.DESC]: "descending",
  } satisfies Record<SortDirection, string>,
} as const;

export const RECEIVED_TOKENS_SUMMARY_NOUNS = {
  singular: "token",
  plural: "tokens",
} as const;

export const RECEIVED_COLLECTIONS_SUMMARY_NOUNS = {
  singular: "collection",
  plural: "collections",
} as const;
