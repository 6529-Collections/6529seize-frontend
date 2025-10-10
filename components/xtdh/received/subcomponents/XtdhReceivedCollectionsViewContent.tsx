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
    selectedCollections,
    collectionFilterOptions,
    filtersAreActive,
    isLoading,
    isFetching,
    activeSort,
    activeDirection,
    handleCollectionsFilterChange,
    handleSortChange,
    handleClearFilters,
    collections,
    expandedCollectionId,
    toggleCollection,
    page,
    totalPages,
    haveNextPage,
    handlePageChange,
  } = state;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <XtdhReceivedCollectionsControls
        resultSummary={resultSummary}
        selectedCollections={selectedCollections}
        collectionFilterOptions={collectionFilterOptions}
        filtersAreActive={filtersAreActive}
        isLoading={isLoading}
        isFetching={isFetching}
        activeSort={activeSort}
        activeDirection={activeDirection}
        onCollectionsFilterChange={handleCollectionsFilterChange}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
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
        onClearFilters={handleClearFilters}
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
