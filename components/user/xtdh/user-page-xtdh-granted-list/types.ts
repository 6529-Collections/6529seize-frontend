import type { SortDirection } from "@/entities/ISort";

export type GrantedFilterStatus =
  | "ALL"
  | "PENDING"
  | "FAILED"
  | "DISABLED"
  | "GRANTED";

export type GrantedFilterStatuses = readonly GrantedFilterStatus[];

export type GrantedSortField =
  | "created_at"
  | "valid_from"
  | "valid_to"
  | "tdh_rate";

export type GrantedStatusCounts = Partial<Record<GrantedFilterStatus, number>>;

export interface UserPageXtdhGrantedListFilters {
  readonly activeStatuses: GrantedFilterStatuses;
  readonly activeSortField: GrantedSortField;
  readonly activeSortDirection: SortDirection;
  readonly apiSortDirection: SortDirection;
  readonly handleStatusChange: (statuses: GrantedFilterStatuses) => void;
  readonly handleSortFieldChange: (sort: GrantedSortField) => void;
}
