import { SortDirection } from "@/entities/ISort";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";

import type {
  GrantedFilterStatus,
  GrantedFilterStatuses,
  GrantedSortField,
  GrantedStatusCounts,
} from "./types";

// DEFAULT_STATUSES represents the canonical "all statuses" sentinel ("ALL" only).
// It is distinct from DEFAULT_FILTER_STATUSES, which reflects the actual UI default.
export const DEFAULT_STATUS: GrantedFilterStatus = "ALL";
export const DEFAULT_STATUSES: GrantedFilterStatuses = [DEFAULT_STATUS];
export const DEFAULT_SORT_FIELD: GrantedSortField = "created_at";
export const DEFAULT_DIRECTION = SortDirection.DESC;

export const STATUS_LABELS: Record<GrantedFilterStatus, string> = {
  ALL: "All statuses",
  PENDING: "Pending",
  FAILED: "Failed",
  DISABLED: "Revoked",
  GRANTED: "Granted",
};

export const BASE_STATUS_ITEMS = [
  { key: "ALL", label: STATUS_LABELS.ALL, value: "ALL" },
  { key: "PENDING", label: STATUS_LABELS.PENDING, value: "PENDING" },
  { key: "FAILED", label: STATUS_LABELS.FAILED, value: "FAILED" },
  { key: "DISABLED", label: STATUS_LABELS.DISABLED, value: "DISABLED" },
  { key: "GRANTED", label: STATUS_LABELS.GRANTED, value: "GRANTED" },
] as const satisfies ReadonlyArray<CommonSelectItem<GrantedFilterStatus>>;

export const GRANTED_TABS = [
  { key: "ACTIVE", label: "Active", value: "ACTIVE" },
  { key: "PENDING", label: "Pending", value: "PENDING" },
  { key: "REVOKED", label: "Revoked", value: "REVOKED" },
  { key: "FAILED", label: "Failed", value: "FAILED" },
] as const satisfies ReadonlyArray<CommonSelectItem<import("./types").GrantedTab>>;

export const GRANTED_ACTIVE_FILTERS = [
  { key: "ALL", label: "All", value: "ALL" },
  { key: "ENDED", label: "Ended", value: "ENDED" },
  { key: "ACTIVE", label: "Active", value: "ACTIVE" },
  { key: "NOT_STARTED", label: "Not Started", value: "NOT_STARTED" },
] as const satisfies ReadonlyArray<CommonSelectItem<import("./types").GrantedActiveFilter>>;

const STATUS_ORDER = BASE_STATUS_ITEMS.map((item) => item.value);
const STATUS_SET = new Set<string>(STATUS_ORDER);

const isGrantedFilterStatus = (value: string): value is GrantedFilterStatus =>
  STATUS_SET.has(value);

export const SORT_ITEMS = [
  { key: "created_at", label: "Created At", value: "created_at" },
  { key: "valid_from", label: "Valid From", value: "valid_from" },
  { key: "valid_to", label: "Valid To", value: "valid_to" },
  { key: "tdh_rate", label: "TDH Rate", value: "tdh_rate" },
] as const satisfies ReadonlyArray<CommonSelectItem<GrantedSortField>>;

/**
 * Normalizes user-provided statuses.
 * - "ALL" alone represents the full set of statuses and is preserved
 * - When combined with specific statuses, "ALL" is removed since specifics win
 * - Empty input falls back to DEFAULT_STATUSES (the "ALL" sentinel)
 */
export function normalizeGrantedStatuses(
  statuses: GrantedFilterStatuses
): GrantedFilterStatuses {
  if (!statuses.length) {
    return DEFAULT_STATUSES;
  }

  const orderedStatuses: GrantedFilterStatus[] = [];
  const seen = new Set<GrantedFilterStatus>();

  for (const status of STATUS_ORDER) {
    if (statuses.includes(status) && !seen.has(status)) {
      orderedStatuses.push(status);
      seen.add(status);
    }
  }

  if (orderedStatuses.length === 0) {
    return DEFAULT_STATUSES;
  }

  if (
    orderedStatuses.length === 1 &&
    orderedStatuses[0] === DEFAULT_STATUS
  ) {
    return DEFAULT_STATUSES;
  }

  return orderedStatuses.filter((status) => status !== DEFAULT_STATUS);
}

// DEFAULT_FILTER_STATUSES expresses the default filter chips (Pending + Granted).
const DEFAULT_FILTER_STATUSES_PRESET: GrantedFilterStatus[] = [
  "PENDING",
  "GRANTED",
];

export const DEFAULT_FILTER_STATUSES: GrantedFilterStatuses =
  normalizeGrantedStatuses(DEFAULT_FILTER_STATUSES_PRESET);

export function areDefaultFilterStatuses(
  statuses: GrantedFilterStatuses
): boolean {
  const normalized = normalizeGrantedStatuses(statuses);
  if (normalized.length !== DEFAULT_FILTER_STATUSES.length) {
    return false;
  }

  return normalized.every(
    (status, index) => status === DEFAULT_FILTER_STATUSES[index]
  );
}

export function parseUserPageXtdhGrantedListStatuses(
  value: string | null
): GrantedFilterStatuses {
  if (!value?.trim()) return DEFAULT_FILTER_STATUSES;
  const parsed = value
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(isGrantedFilterStatus);

  return normalizeGrantedStatuses(parsed);
}

export function serializeUserPageXtdhGrantedListStatuses(
  statuses: GrantedFilterStatuses
): string | null {
  return serializeNormalizedUserPageXtdhGrantedListStatuses(
    normalizeGrantedStatuses(statuses)
  );
}

export function serializeNormalizedUserPageXtdhGrantedListStatuses(
  normalizedStatuses: GrantedFilterStatuses
): string | null {
  if (areAllGrantedStatusesNormalized(normalizedStatuses)) {
    return DEFAULT_STATUS;
  }
  return normalizedStatuses.join(",");
}

export function areAllGrantedStatuses(
  statuses: GrantedFilterStatuses
): boolean {
  return areAllGrantedStatusesNormalized(
    normalizeGrantedStatuses(statuses)
  );
}

export function areAllGrantedStatusesNormalized(
  normalizedStatuses: GrantedFilterStatuses
): boolean {
  return (
    normalizedStatuses.length === 1 && normalizedStatuses[0] === DEFAULT_STATUS
  );
}

export function parseUserPageXtdhGrantedListSortField(
  value: string | null
): GrantedSortField {
  if (!value) return DEFAULT_SORT_FIELD;
  const normalized = value.trim().toLowerCase();
  return (
    SORT_ITEMS.find((item) => item.value === normalized)?.value ??
    DEFAULT_SORT_FIELD
  );
}

export function parseUserPageXtdhGrantedListSortDirection(
  value: string | null
): SortDirection {
  if (!value) return DEFAULT_DIRECTION;
  const normalized = value.trim().toUpperCase();
  return normalized === SortDirection.ASC ? SortDirection.ASC : SortDirection.DESC;
}

export function normalizeUserPageXtdhGrantedListSortDirection(
  value: SortDirection | string
): SortDirection {
  const normalized =
    typeof value === "string" ? value.trim().toUpperCase() : value;
  return normalized === SortDirection.ASC ? SortDirection.ASC : SortDirection.DESC;
}

export function formatUserPageXtdhGrantedListStatusLabel(
  status: GrantedFilterStatus,
  count: number | undefined
): string {
  const base = STATUS_LABELS[status];
  if (typeof count === "number") {
    return `${base} (${count.toLocaleString()})`;
  }
  return base;
}

export function getUserPageXtdhGrantedListStatusItems(
  statusCounts: GrantedStatusCounts
): CommonSelectItem<GrantedFilterStatus>[] {
  return BASE_STATUS_ITEMS.map((item) => ({
    ...item,
    label: formatUserPageXtdhGrantedListStatusLabel(
      item.value,
      statusCounts[item.value]
    ),
  }));
}

export function getApiParamsFromFilters(
  tab: import("./types").GrantedTab,
  subFilter: import("./types").GrantedActiveFilter
): {
  readonly statuses: GrantedFilterStatuses;
  readonly validFromGt?: number;
  readonly validFromLt?: number;
  readonly validToGt?: number;
  readonly validToLt?: number;
} {
  const now = Date.now();

  switch (tab) {
    case "PENDING":
      return { statuses: ["PENDING"] };
    case "REVOKED":
      return { statuses: ["DISABLED"] };
    case "FAILED":
      return { statuses: ["FAILED"] };
    case "ACTIVE":
      switch (subFilter) {
        case "ENDED":
          return { statuses: ["GRANTED"], validToLt: now };
        case "ACTIVE":
          // Active: Started (validFrom < now) AND (Not ended (validTo > now) OR validTo is null)
          // API supports validToGt including nulls.
          return {
            statuses: ["GRANTED"],
            validFromLt: now,
            validToGt: now,
          };
        case "NOT_STARTED":
          return { statuses: ["GRANTED"], validFromGt: now };
        case "ALL":
        default:
          return { statuses: ["GRANTED"] };
      }
    default:
      return { statuses: ["GRANTED"] };
  }
}
