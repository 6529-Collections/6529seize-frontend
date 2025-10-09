import type { SortDirection } from "@/entities/ISort";

export type GrantedFilterStatus = "ALL" | "PENDING" | "FAILED" | "GRANTED";

export type GrantedSortField =
  | "created_at"
  | "valid_from"
  | "valid_to"
  | "tdh_rate";

export type GrantedStatusCounts = Partial<Record<GrantedFilterStatus, number>>;

export interface UserPageXtdhGrantedListFilters {
  readonly activeStatus: GrantedFilterStatus;
  readonly activeSortField: GrantedSortField;
  readonly activeSortDirection: SortDirection;
  readonly apiSortDirection: SortDirection;
  readonly handleStatusChange: (status: GrantedFilterStatus) => void;
  readonly handleSortFieldChange: (sort: GrantedSortField) => void;
}

