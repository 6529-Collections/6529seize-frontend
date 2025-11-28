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

export type GrantedTab = "PENDING" | "ACTIVE" | "REVOKED" | "FAILED";

export type GrantedActiveFilter = "ALL" | "ENDED" | "ACTIVE" | "NOT_STARTED";

export interface UserPageXtdhGrantedListFilters {
  readonly activeTab: GrantedTab;
  readonly activeSubFilter: GrantedActiveFilter;
  readonly activeSortField: GrantedSortField;
  readonly activeSortDirection: SortDirection;
  readonly apiSortDirection: SortDirection;
  readonly handleTabChange: (tab: GrantedTab) => void;
  readonly handleSubFilterChange: (filter: GrantedActiveFilter) => void;
  readonly handleSortFieldChange: (sort: GrantedSortField) => void;
}
