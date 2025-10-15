import type { SortDirection } from "@/entities/ISort";
import type { XtdhReceivedNft } from "@/types/xtdh";
import type {
  XtdhCollectionOwnershipFilter,
  XtdhCollectionsDiscoveryFilter,
  XtdhNftSortField,
} from "../utils/constants";

export interface XtdhReceivedNftsViewEmptyCopy {
  readonly defaultMessage: string;
  readonly filteredMessage: string;
  readonly filteredActionLabel?: string;
}

export interface XtdhReceivedNftsViewState {
  readonly missingScopeMessage?: string;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly isError: boolean;
  readonly errorMessage?: string;
  readonly nfts: XtdhReceivedNft[];
  readonly activeSort: XtdhNftSortField;
  readonly activeDirection: SortDirection;
  readonly collectionFilterOptions: {
    readonly id: string;
    readonly name: string;
    readonly tokenCount: number;
  }[];
  readonly filtersAreActive: boolean;
  readonly selectedCollections: string[];
  readonly resultSummary: string;
  readonly page: number;
  readonly totalPages: number;
  readonly haveNextPage: boolean;
  readonly handleSortChange: (nextSort: XtdhNftSortField) => void;
  readonly handleCollectionsFilterChange: (nextSelected: string[]) => void;
  readonly handleClearFilters: () => void;
  readonly handlePageChange: (page: number) => void;
  readonly handleRetry: () => void;
  readonly clearFiltersLabel?: string;
  readonly emptyStateCopy?: XtdhReceivedNftsViewEmptyCopy;
  readonly searchQuery: string;
  readonly handleSearchChange: (value: string) => void;
  readonly ownershipFilter: XtdhCollectionOwnershipFilter;
  readonly handleOwnershipFilterChange: (
    filter: XtdhCollectionOwnershipFilter,
  ) => void;
  readonly discoveryFilter: XtdhCollectionsDiscoveryFilter;
  readonly handleDiscoveryFilterChange: (
    filter: XtdhCollectionsDiscoveryFilter,
  ) => void;
}
