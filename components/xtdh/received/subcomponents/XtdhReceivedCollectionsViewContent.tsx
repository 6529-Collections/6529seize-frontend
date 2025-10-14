'use client';

import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";

import type { XtdhReceivedView, XtdhCollectionsSortField } from "../utils/constants";
import { XTDH_COLLECTION_SORT_ITEMS } from "../utils/constants";
import { XtdhReceivedCollectionsControls } from "./XtdhReceivedCollectionsControls";
import { XtdhReceivedCollectionsList } from "./XtdhReceivedCollectionsList";
import type {
  XtdhReceivedCollectionsViewEmptyCopy,
  XtdhReceivedCollectionsViewState,
} from "./XtdhReceivedCollectionsView.types";

interface XtdhReceivedCollectionsViewContentProps {
  readonly view: XtdhReceivedView;
  readonly onViewChange: (view: XtdhReceivedView) => void;
  readonly announcement: string;
  readonly state: XtdhReceivedCollectionsViewState;
  readonly clearFiltersLabel: string;
  readonly emptyStateCopy: XtdhReceivedCollectionsViewEmptyCopy;
  readonly shouldShowPagination: boolean;
}

/**
 * Renders the main view layout once all fallback states have been handled.
 */
export function XtdhReceivedCollectionsViewContent({
  view,
  onViewChange,
  announcement,
  state,
  clearFiltersLabel,
  emptyStateCopy,
  shouldShowPagination,
}: XtdhReceivedCollectionsViewContentProps) {
  const {
    resultSummary,
    filtersAreActive,
    isLoading,
    isFetching,
    activeSort,
    activeDirection,
    handleSortChange,
    collections,
    expandedCollectionId,
    toggleCollection,
    page,
    totalPages,
    haveNextPage,
    handlePageChange,
    searchQuery,
    handleSearchChange,
    ownershipFilter,
    handleOwnershipFilterChange,
    discoveryFilter,
    handleDiscoveryFilterChange,
    handleResetFilters,
  } = state;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <XtdhReceivedCollectionsControls
        resultSummary={resultSummary}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        ownershipFilter={ownershipFilter}
        onOwnershipFilterChange={handleOwnershipFilterChange}
        discoveryFilter={discoveryFilter}
        onDiscoveryFilterChange={handleDiscoveryFilterChange}
        filtersAreActive={filtersAreActive}
        isLoading={isLoading}
        activeSort={activeSort}
        activeDirection={activeDirection}
        onSortChange={handleSortChange}
        view={view}
        onViewChange={onViewChange}
        announcement={announcement}
      />

      <div className="hidden md:block">
        <CommonTabs<XtdhCollectionsSortField>
          items={XTDH_COLLECTION_SORT_ITEMS}
          activeItem={activeSort}
          filterLabel="Sort collections"
          setSelected={handleSortChange}
          sortDirection={activeDirection}
          disabled={isLoading}
        />
      </div>

      <XtdhReceivedCollectionsList
        isLoading={isLoading}
        collections={collections}
        filtersAreActive={filtersAreActive}
        emptyStateCopy={emptyStateCopy}
        onClearFilters={handleResetFilters}
        expandedCollectionId={expandedCollectionId}
        onToggleCollection={toggleCollection}
        clearFiltersLabel={clearFiltersLabel}
      />

      {shouldShowPagination && (
        <CommonTablePagination
          small={true}
          currentPage={page}
          setCurrentPage={handlePageChange}
          totalPages={totalPages}
          haveNextPage={haveNextPage}
          loading={isFetching}
        />
      )}
    </div>
  );
}
