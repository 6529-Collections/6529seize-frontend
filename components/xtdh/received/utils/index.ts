import { SortDirection } from "@/entities/ISort";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { UseReceivedCollectionsFilters } from "@/hooks/useXtdhReceived";
import type { XtdhReceivedCollectionOption, XtdhReceivedCollectionSummary } from "@/types/xtdh";
import {
  DEFAULT_COLLECTION_SORT,
  DEFAULT_DIRECTION,
  DEFAULT_NFT_SORT,
  NEWLY_ALLOCATED_WINDOW_DAYS,
  TRENDING_RATE_CHANGE_THRESHOLD,
  XTDH_COLLECTION_SORT_ITEMS,
  XTDH_NFT_SORT_ITEMS,
} from "./constants";

export function parseXtdhCollectionsSort(value: string | null) {
  if (!value) return DEFAULT_COLLECTION_SORT;
  const normalized = value.toLowerCase();
  return (
    XTDH_COLLECTION_SORT_ITEMS.find((item) => item.value === normalized)?.value ??
    DEFAULT_COLLECTION_SORT
  );
}

export function parseXtdhNftSort(value: string | null) {
  if (!value) return DEFAULT_NFT_SORT;
  const normalized = value.toLowerCase();
  return (
    XTDH_NFT_SORT_ITEMS.find((item) => item.value === normalized)?.value ??
    DEFAULT_NFT_SORT
  );
}

export function parseXtdhSortDirection(value: string | null): SortDirection {
  if (!value) return DEFAULT_DIRECTION;
  const normalized = value.trim().toUpperCase();
  return normalized === SortDirection.ASC ? SortDirection.ASC : SortDirection.DESC;
}

export function xtdhToApiDirection(direction: SortDirection): "asc" | "desc" {
  return direction === SortDirection.ASC ? "asc" : "desc";
}

export function parseXtdhPage(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export function parseXtdhCollectionsFilterParam(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseXtdhNumberParam(value: string | null) {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function xtdhHasActiveFilters(filters: UseReceivedCollectionsFilters) {
  return Boolean(
    (filters.collections && filters.collections.length > 0) ||
      typeof filters.minRate === "number" ||
      typeof filters.minGrantors === "number"
  );
}

export function mergeXtdhCollectionOptions(
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

export function formatXtdhValue(value: number) {
  if (Number.isNaN(value)) return "-";
  return formatNumberWithCommas(value);
}

export function formatXtdhRate(value: number) {
  return `${formatXtdhValue(value)} /day`;
}

export function formatXtdhTotal(value: number) {
  return formatXtdhValue(value);
}

export function getCollectionTokensReceiving(
  collection: XtdhReceivedCollectionSummary,
) {
  return collection.receivingTokenCount ?? collection.tokenCount;
}

export function getCollectionGrantorCount(
  collection: XtdhReceivedCollectionSummary,
) {
  if (typeof collection.grantorCount === "number") {
    return collection.grantorCount;
  }

  if (Array.isArray(collection.granters)) {
    return collection.granters.length;
  }

  if (Array.isArray(collection.topGrantors)) {
    return collection.topGrantors.length;
  }

  return 0;
}

export function formatTokensReceivingLabel(count: number) {
  const formatted = formatNumberWithCommas(count);
  const suffix = count === 1 ? "token" : "tokens";
  return `${formatted} ${suffix} receiving xTDH`;
}

export type RateChangeDelta =
  | {
      readonly trend: "positive" | "negative" | "neutral";
      readonly percentageLabel: string;
    }
  | undefined;

export function getRateChangeDelta(rateChange?: number | null): RateChangeDelta {
  if (typeof rateChange !== "number" || Number.isNaN(rateChange)) {
    return undefined;
  }

  const percentage = rateChange * 100;
  const absoluteValue = Math.abs(percentage);

  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: absoluteValue < 1 ? 1 : 0,
    maximumFractionDigits: absoluteValue < 10 ? 1 : 0,
  });

  const percentageLabel = `${formatter.format(absoluteValue)}%`;

  if (percentage > 0) {
    return {
      trend: "positive",
      percentageLabel,
    };
  }

  if (percentage < 0) {
    return {
      trend: "negative",
      percentageLabel,
    };
  }

  return {
    trend: "neutral",
    percentageLabel,
  };
}

export function formatUpdatedRelativeLabel(
  date?: string | null,
  reference = Date.now(),
) {
  if (!date) {
    return undefined;
  }

  const timestamp = new Date(date).getTime();
  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  const diffMs = Math.max(reference - timestamp, 0);
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) {
    return "Updated just now";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `Updated ${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Updated ${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `Updated ${diffDays}d ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) {
    return `Updated ${diffWeeks}w ago`;
  }

  return `Updated ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(timestamp)}`;
}

export function xtdhIsCollectionNewlyAllocated(
  collection: XtdhReceivedCollectionSummary,
  windowDays = NEWLY_ALLOCATED_WINDOW_DAYS,
  reference = Date.now(),
): boolean {
  if (typeof collection.firstAllocationDaysAgo === "number") {
    return collection.firstAllocationDaysAgo <= windowDays;
  }

  if (!collection.firstAllocatedAt) {
    return false;
  }

  const firstAllocationTime = new Date(collection.firstAllocatedAt).getTime();
  if (!Number.isFinite(firstAllocationTime)) {
    return false;
  }

  const diffMs = reference - firstAllocationTime;
  const diffDays = diffMs / 86_400_000;
  return diffDays <= windowDays;
}

export function xtdhIsCollectionTrending(
  collection: XtdhReceivedCollectionSummary,
  threshold = TRENDING_RATE_CHANGE_THRESHOLD,
): boolean {
  return (collection.rateChange7d ?? 0) >= threshold;
}
