import type { SortDirection } from "@/entities/ISort";
import type {
  XtdhCollectionOwnershipFilter,
  XtdhCollectionsDiscoveryFilter,
  XtdhCollectionsSortField,
  XtdhReceivedView,
} from "../utils/constants";

export interface XtdhReceivedCollectionsControlsProps {
  readonly resultSummary: string;
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly ownershipFilter: XtdhCollectionOwnershipFilter;
  readonly onOwnershipFilterChange: (
    filter: XtdhCollectionOwnershipFilter,
  ) => void;
  readonly discoveryFilter: XtdhCollectionsDiscoveryFilter;
  readonly onDiscoveryFilterChange: (
    filter: XtdhCollectionsDiscoveryFilter,
  ) => void;
  readonly filtersAreActive: boolean;
  readonly isLoading: boolean;
  readonly activeSort: XtdhCollectionsSortField;
  readonly activeDirection: SortDirection;
  readonly onSortChange: (nextSort: XtdhCollectionsSortField) => void;
  readonly view: XtdhReceivedView;
  readonly onViewChange: (view: XtdhReceivedView) => void;
  readonly announcement: string;
}
