'use client';

import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import { useXtdhReceivedCollectionsState } from "../hooks";
import type { XtdhReceivedView } from "../utils/constants";
import { XtdhReceivedCollectionsControls } from "./XtdhReceivedCollectionsControls";
import { XtdhReceivedCollectionsList } from "./XtdhReceivedCollectionsList";
import { XtdhReceivedEmptyState } from "./XtdhReceivedEmptyState";
import { XtdhReceivedErrorState } from "./XtdhReceivedErrorState";
import type {
  XtdhReceivedCollectionsViewEmptyCopy,
  XtdhReceivedCollectionsViewState,
} from "./XtdhReceivedCollectionsView.types";

const DEFAULT_CLEAR_FILTERS_LABEL = "Clear filters";

const DEFAULT_EMPTY_STATE_COPY: XtdhReceivedCollectionsViewEmptyCopy = {
  defaultMessage:
    "You haven't received any xTDH grants for your collections yet. Once granters allocate xTDH to collections you hold, they will appear here.",
  filtersMessage: "No collections match your filters.",
  filtersActionLabel: DEFAULT_CLEAR_FILTERS_LABEL,
};

export interface XtdhReceivedCollectionsViewProps {
  readonly view: XtdhReceivedView;
  readonly onViewChange: (view: XtdhReceivedView) => void;
  readonly announcement: string;
  readonly state: XtdhReceivedCollectionsViewState;
}

export function XtdhReceivedCollectionsView({
  view,
  onViewChange,
  announcement,
  state,
}: XtdhReceivedCollectionsViewProps) {
  const {
    missingScopeMessage,
    isLoading,
    isFetching,
    isError,
    errorMessage,
    collections,
    activeSort,
    activeDirection,
    collectionFilterOptions,
    filtersAreActive,
    selectedCollections,
    resultSummary,
    page,
    totalPages,
    haveNextPage,
    handleSortChange,
    handleCollectionsFilterChange,
    handleClearFilters,
    handlePageChange,
    handleRetry,
    expandedCollectionId,
    toggleCollection,
    emptyStateCopy,
    clearFiltersLabel,
  } = state;

  if (missingScopeMessage) {
    return <XtdhReceivedEmptyState message={missingScopeMessage} />;
  }

  if (isError) {
    return (
      <XtdhReceivedErrorState
        message={errorMessage ?? ""}
        onRetry={handleRetry}
      />
    );
  }

  const effectiveEmptyStateCopy =
    emptyStateCopy ?? DEFAULT_EMPTY_STATE_COPY;
  const effectiveClearFiltersLabel =
    clearFiltersLabel ?? DEFAULT_CLEAR_FILTERS_LABEL;

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
        clearFiltersLabel={effectiveClearFiltersLabel}
      />

      <XtdhReceivedCollectionsList
        isLoading={isLoading}
        collections={collections}
        filtersAreActive={filtersAreActive}
        emptyStateCopy={effectiveEmptyStateCopy}
        onClearFilters={handleClearFilters}
        expandedCollectionId={expandedCollectionId}
        onToggleCollection={toggleCollection}
        clearFiltersLabel={effectiveClearFiltersLabel}
      />

      {collections.length > 0 && totalPages > 1 && (
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

export interface XtdhReceivedCollectionsUserViewProps {
  readonly profileId: string | null;
  readonly view: XtdhReceivedView;
  readonly onViewChange: (view: XtdhReceivedView) => void;
  readonly announcement: string;
}

export function XtdhReceivedCollectionsUserView({
  profileId,
  view,
  onViewChange,
  announcement,
}: XtdhReceivedCollectionsUserViewProps) {
  const {
    collections,
    isLoading,
    isFetching,
    isError,
    error,
    activeSort,
    activeDirection,
    collectionFilterOptions,
    filtersAreActive,
    selectedCollections,
    resultSummary,
    page,
    totalPages,
    haveNextPage,
    handleSortChange,
    handleCollectionsFilterChange,
    handleClearFilters,
    handlePageChange,
    handleRetry,
    expandedCollectionId,
    toggleCollection,
  } = useXtdhReceivedCollectionsState(profileId);

  const viewState: XtdhReceivedCollectionsViewState = {
    missingScopeMessage: profileId
      ? undefined
      : "Unable to determine which profile to load.",
    isLoading,
    isFetching,
    isError,
    errorMessage: error instanceof Error ? error.message : undefined,
    collections,
    activeSort,
    activeDirection,
    collectionFilterOptions,
    filtersAreActive,
    selectedCollections,
    resultSummary,
    page,
    totalPages,
    haveNextPage,
    handleSortChange,
    handleCollectionsFilterChange,
    handleClearFilters,
    handlePageChange,
    handleRetry,
    expandedCollectionId,
    toggleCollection,
    emptyStateCopy: DEFAULT_EMPTY_STATE_COPY,
    clearFiltersLabel: DEFAULT_CLEAR_FILTERS_LABEL,
  };

  return (
    <XtdhReceivedCollectionsView
      view={view}
      onViewChange={onViewChange}
      announcement={announcement}
      state={viewState}
    />
  );
}
