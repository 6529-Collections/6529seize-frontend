'use client';

import { useXtdhReceivedCollectionsState } from "../hooks";
import type { XtdhReceivedView } from "../utils/constants";
import {
  DEFAULT_CLEAR_FILTERS_LABEL,
  DEFAULT_EMPTY_STATE_COPY,
} from "./XtdhReceivedCollectionsView.constants";
import { XtdhReceivedCollectionsView } from "./XtdhReceivedCollectionsView";
import type { XtdhReceivedCollectionsViewState } from "./XtdhReceivedCollectionsView.types";

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
