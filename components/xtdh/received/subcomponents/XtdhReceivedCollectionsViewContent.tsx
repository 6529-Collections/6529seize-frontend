'use client';

import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";

import type { XtdhReceivedView } from "../utils/constants";
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
    isMyAllocationsActive,
    handleToggleMyAllocations,
    isTrendingActive,
    handleToggleTrending,
    isNewlyAllocatedActive,
    handleToggleNewlyAllocated,
    activeFilters,
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
        isMyAllocationsActive={isMyAllocationsActive}
        onToggleMyAllocations={handleToggleMyAllocations}
        isTrendingActive={isTrendingActive}
        onToggleTrending={handleToggleTrending}
        isNewlyAllocatedActive={isNewlyAllocatedActive}
        onToggleNewlyAllocated={handleToggleNewlyAllocated}
        activeFilters={activeFilters}
        filtersAreActive={filtersAreActive}
        isLoading={isLoading}
        activeSort={activeSort}
        activeDirection={activeDirection}
        onSortChange={handleSortChange}
        onResetFilters={handleResetFilters}
        view={view}
        onViewChange={onViewChange}
        announcement={announcement}
        clearFiltersLabel={clearFiltersLabel}
      />

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
