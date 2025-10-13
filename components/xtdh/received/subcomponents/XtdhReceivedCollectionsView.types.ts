import type { SortDirection } from "@/entities/ISort";
import type { XtdhReceivedCollectionSummary } from "@/types/xtdh";
import type {
  XtdhCollectionOwnershipFilter,
  XtdhCollectionsSortField,
  XtdhCollectionsDiscoveryFilter,
} from "../utils/constants";

export interface XtdhActiveFilterChip {
  readonly label: string;
  readonly onRemove?: () => void;
}

export interface XtdhReceivedCollectionsViewEmptyCopy {
  readonly defaultMessage: string;
  readonly filtersMessage: string;
  readonly filtersActionLabel?: string;
}

export interface XtdhReceivedCollectionsViewState {
  readonly missingScopeMessage?: string;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly isError: boolean;
  readonly errorMessage?: string;
  readonly collections: XtdhReceivedCollectionSummary[];
  readonly activeSort: XtdhCollectionsSortField;
  readonly activeDirection: SortDirection;
  readonly filtersAreActive: boolean;
  readonly resultSummary: string;
  readonly page: number;
  readonly totalPages: number;
  readonly haveNextPage: boolean;
  readonly handleSortChange: (nextSort: XtdhCollectionsSortField) => void;
  readonly handlePageChange: (page: number) => void;
  readonly handleRetry: () => void;
  readonly expandedCollectionId: string | null;
  readonly toggleCollection: (collectionId: string) => void;
  readonly emptyStateCopy?: XtdhReceivedCollectionsViewEmptyCopy;
  readonly clearFiltersLabel?: string;
  readonly searchQuery: string;
  readonly handleSearchChange: (value: string) => void;
  readonly ownershipFilter: XtdhCollectionOwnershipFilter;
  readonly handleOwnershipFilterChange: (
    next: XtdhCollectionOwnershipFilter,
  ) => void;
  readonly discoveryFilter: XtdhCollectionsDiscoveryFilter;
  readonly handleDiscoveryFilterChange: (
    next: XtdhCollectionsDiscoveryFilter,
  ) => void;
  readonly activeFilters: XtdhActiveFilterChip[];
  readonly handleResetFilters: () => void;
}
