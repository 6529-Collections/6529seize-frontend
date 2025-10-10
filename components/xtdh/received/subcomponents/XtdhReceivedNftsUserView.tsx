'use client';

import { useXtdhReceivedNftsState } from "../hooks";
import type { XtdhReceivedView } from "../utils/constants";
import {
  DEFAULT_CLEAR_FILTERS_LABEL,
  DEFAULT_EMPTY_STATE_COPY,
} from "./XtdhReceivedNftsView.constants";
import { XtdhReceivedNftsView } from "./XtdhReceivedNftsView";
import type { XtdhReceivedNftsViewState } from "./XtdhReceivedNftsView.types";

export interface XtdhReceivedNftsUserViewProps {
  readonly profileId: string | null;
  readonly view: XtdhReceivedView;
  readonly onViewChange: (view: XtdhReceivedView) => void;
  readonly announcement: string;
}

export function XtdhReceivedNftsUserView({
  profileId,
  view,
  onViewChange,
  announcement,
}: XtdhReceivedNftsUserViewProps) {
  const {
    nfts,
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
  } = useXtdhReceivedNftsState(profileId);

  const viewState: XtdhReceivedNftsViewState = {
    missingScopeMessage: profileId
      ? undefined
      : "Unable to determine which profile to load.",
    isLoading,
    isFetching,
    isError,
    errorMessage: error instanceof Error ? error.message : undefined,
    nfts,
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
    clearFiltersLabel: DEFAULT_CLEAR_FILTERS_LABEL,
    emptyStateCopy: DEFAULT_EMPTY_STATE_COPY,
  };

  return (
    <XtdhReceivedNftsView
      view={view}
      onViewChange={onViewChange}
      announcement={announcement}
      state={viewState}
    />
  );
}
