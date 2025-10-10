import type { SortDirection } from "@/entities/ISort";
import type { XtdhReceivedCollectionSummary } from "@/types/xtdh";
import type { XtdhCollectionsSortField } from "../utils/constants";

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
  readonly collectionFilterOptions: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly tokenCount: number;
  }>;
  readonly filtersAreActive: boolean;
  readonly selectedCollections: string[];
  readonly resultSummary: string;
  readonly page: number;
  readonly totalPages: number;
  readonly haveNextPage: boolean;
  readonly handleSortChange: (nextSort: XtdhCollectionsSortField) => void;
  readonly handleCollectionsFilterChange: (nextSelected: string[]) => void;
  readonly handleClearFilters: () => void;
  readonly handlePageChange: (page: number) => void;
  readonly handleRetry: () => void;
  readonly expandedCollectionId: string | null;
  readonly toggleCollection: (collectionId: string) => void;
  readonly emptyStateCopy?: XtdhReceivedCollectionsViewEmptyCopy;
  readonly clearFiltersLabel?: string;
}
