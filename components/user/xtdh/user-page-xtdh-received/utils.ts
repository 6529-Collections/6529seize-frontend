import { SortDirection } from "@/entities/ISort";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { UseReceivedCollectionsFilters } from "@/hooks/useXtdhReceived";
import type { XtdhReceivedCollectionOption } from "@/types/xtdh";
import {
  COLLECTION_SORT_ITEMS,
  DEFAULT_COLLECTION_SORT,
  DEFAULT_DIRECTION,
  DEFAULT_NFT_SORT,
  NFT_SORT_ITEMS,
} from "./constants";

export function parseCollectionsSort(value: string | null) {
  if (!value) return DEFAULT_COLLECTION_SORT;
  const normalized = value.toLowerCase();
  return (
    COLLECTION_SORT_ITEMS.find((item) => item.value === normalized)?.value ??
    DEFAULT_COLLECTION_SORT
  );
}

export function parseNftSort(value: string | null) {
  if (!value) return DEFAULT_NFT_SORT;
  const normalized = value.toLowerCase();
  return (
    NFT_SORT_ITEMS.find((item) => item.value === normalized)?.value ??
    DEFAULT_NFT_SORT
  );
}

export function parseSortDirection(value: string | null): SortDirection {
  if (!value) return DEFAULT_DIRECTION;
  const normalized = value.trim().toUpperCase();
  return normalized === SortDirection.ASC ? SortDirection.ASC : SortDirection.DESC;
}

export function toApiDirection(direction: SortDirection): "asc" | "desc" {
  return direction === SortDirection.ASC ? "asc" : "desc";
}

export function parsePage(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export function parseCollectionsFilterParam(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseNumberParam(value: string | null) {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function hasActiveFilters(filters: UseReceivedCollectionsFilters) {
  return Boolean(
    (filters.collections && filters.collections.length > 0) ||
      typeof filters.minRate === "number" ||
      typeof filters.minGrantors === "number"
  );
}

export function mergeCollectionOptions(
  options: XtdhReceivedCollectionOption[],
  selected: string[]
) {
  if (!selected.length) {
    return options;
  }

  const map = new Map<string, XtdhReceivedCollectionOption>();
  for (const option of options) {
    map.set(option.collectionId, option);
  }

  for (const id of selected) {
    if (!map.has(id)) {
      map.set(id, {
        collectionId: id,
        collectionName: id,
        tokenCount: 0,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.collectionName.localeCompare(b.collectionName)
  );
}

export function formatValue(value: number) {
  if (Number.isNaN(value)) return "-";
  return formatNumberWithCommas(value);
}

export function formatRate(value: number) {
  return `${formatValue(value)} /day`;
}

export function formatTotal(value: number) {
  return formatValue(value);
}
