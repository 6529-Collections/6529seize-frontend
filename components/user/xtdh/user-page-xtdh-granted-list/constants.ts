import { SortDirection } from "@/entities/ISort";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";

import type {
  GrantedFilterStatus,
  GrantedFilterStatuses,
  GrantedSortField,
  GrantedStatusCounts,
} from "./types";

export const DEFAULT_STATUS: GrantedFilterStatus = "ALL";
export const DEFAULT_STATUSES: GrantedFilterStatuses = [DEFAULT_STATUS];
export const DEFAULT_SORT_FIELD: GrantedSortField = "created_at";
export const DEFAULT_DIRECTION = SortDirection.DESC;

export const STATUS_LABELS: Record<GrantedFilterStatus, string> = {
  ALL: "All statuses",
  PENDING: "Pending",
  FAILED: "Failed",
  DISABLED: "Disabled",
  GRANTED: "Granted",
};

export const BASE_STATUS_ITEMS = [
  { key: "ALL", label: STATUS_LABELS.ALL, value: "ALL" },
  { key: "PENDING", label: STATUS_LABELS.PENDING, value: "PENDING" },
  { key: "FAILED", label: STATUS_LABELS.FAILED, value: "FAILED" },
  { key: "DISABLED", label: STATUS_LABELS.DISABLED, value: "DISABLED" },
  { key: "GRANTED", label: STATUS_LABELS.GRANTED, value: "GRANTED" },
] as const satisfies ReadonlyArray<CommonSelectItem<GrantedFilterStatus>>;

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
  if (!value) return DEFAULT_FILTER_STATUSES;
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
  const normalized = value.toLowerCase();
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
  return value === SortDirection.ASC || value === "ASC"
    ? SortDirection.ASC
    : SortDirection.DESC;
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
