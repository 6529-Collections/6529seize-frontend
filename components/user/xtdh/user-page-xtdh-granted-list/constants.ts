import { SortDirection } from "@/entities/ISort";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";

import type {
  GrantedFilterStatus,
  GrantedSortField,
  GrantedStatusCounts,
} from "./types";

export const DEFAULT_STATUS: GrantedFilterStatus = "ALL";
export const DEFAULT_SORT_FIELD: GrantedSortField = "created_at";
export const DEFAULT_DIRECTION = SortDirection.DESC;

export const STATUS_LABELS: Record<GrantedFilterStatus, string> = {
  ALL: "All statuses",
  PENDING: "Pending",
  FAILED: "Failed",
  DISABLED: "Disabled",
  GRANTED: "Granted",
};

export const BASE_STATUS_ITEMS: CommonSelectItem<GrantedFilterStatus>[] = [
  { key: "ALL", label: STATUS_LABELS.ALL, value: "ALL" },
  { key: "PENDING", label: STATUS_LABELS.PENDING, value: "PENDING" },
  { key: "FAILED", label: STATUS_LABELS.FAILED, value: "FAILED" },
  { key: "DISABLED", label: STATUS_LABELS.DISABLED, value: "DISABLED" },
  { key: "GRANTED", label: STATUS_LABELS.GRANTED, value: "GRANTED" },
];

export const SORT_ITEMS: CommonSelectItem<GrantedSortField>[] = [
  { key: "created_at", label: "Created At", value: "created_at" },
  { key: "valid_from", label: "Valid From", value: "valid_from" },
  { key: "valid_to", label: "Valid To", value: "valid_to" },
  { key: "tdh_rate", label: "TDH Rate", value: "tdh_rate" },
];

export function parseUserPageXtdhGrantedListStatus(
  value: string | null
): GrantedFilterStatus {
  if (!value) return DEFAULT_STATUS;
  const normalized = value.toUpperCase();
  return (
    BASE_STATUS_ITEMS.find((item) => item.value === normalized)?.value ??
    DEFAULT_STATUS
  );
}

export function parseUserPageXtdhGrantedListSortField(
  value: string | null
): GrantedSortField {
  if (!value) return DEFAULT_SORT_FIELD;
  const normalized = value.toLowerCase() as GrantedSortField;
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
