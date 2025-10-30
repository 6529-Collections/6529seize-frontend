"use client";

import { useCallback, useMemo, useState } from "react";

import XtdhReceivedSection from "../../received";
import type {
  XtdhReceivedCollectionsViewState,
  XtdhReceivedNftsViewState,
} from "@/components/xtdh/received/subcomponents";
import {
  DEFAULT_CLEAR_FILTERS_LABEL as COLLECTIONS_CLEAR_FILTERS_LABEL,
  DEFAULT_EMPTY_STATE_COPY as COLLECTIONS_EMPTY_STATE_COPY,
} from "@/components/xtdh/received/subcomponents/XtdhReceivedCollectionsView.constants";
import {
  DEFAULT_CLEAR_FILTERS_LABEL as NFTS_CLEAR_FILTERS_LABEL,
  DEFAULT_EMPTY_STATE_COPY as NFTS_EMPTY_STATE_COPY,
} from "@/components/xtdh/received/subcomponents/XtdhReceivedNftsView.constants";
import {
  useXtdhUserReceivedCollectionsState,
  useXtdhUserReceivedNftsState,
} from "./hooks";
import type { XtdhReceivedView } from "@/components/xtdh/received/utils/constants";

export interface UserXtdhReceivedSectionProps {
  readonly profileId: string | null;
}

const MISSING_SCOPE_MESSAGE = "Unable to determine which profile to load.";

/**
 * User-scoped wrapper around the shared xTDH received section.
 * Keeps the public contract identical while delegating to the shared module.
 */
export default function UserPageXtdhReceived({
  profileId,
}: UserXtdhReceivedSectionProps) {
  const [view, setView] = useState<XtdhReceivedView>("collections");
  const [hasViewedNfts, setHasViewedNfts] = useState<boolean>(false);

  const handleViewChange = useCallback((next: XtdhReceivedView) => {
    setView(next);
    if (next === "nfts") {
      setHasViewedNfts(true);
    }
  }, []);

  const collectionsStateData = useXtdhUserReceivedCollectionsState(profileId, {
    enabled: true,
  });

  const nftsStateData = useXtdhUserReceivedNftsState(profileId, {
    enabled: hasViewedNfts || view === "nfts",
  });

  const collectionsViewState = useMemo<XtdhReceivedCollectionsViewState>(
    () => ({
      missingScopeMessage: profileId ? undefined : MISSING_SCOPE_MESSAGE,
      isLoading: collectionsStateData.isLoading,
      isFetching: collectionsStateData.isFetching,
      isError: collectionsStateData.isError,
      errorMessage:
        collectionsStateData.error instanceof Error
          ? collectionsStateData.error.message
          : undefined,
      collections: collectionsStateData.collections,
      activeSort: collectionsStateData.activeSort,
      activeDirection: collectionsStateData.activeDirection,
      filtersAreActive: collectionsStateData.filtersAreActive,
      resultSummary: collectionsStateData.resultSummary,
      page: collectionsStateData.page,
      totalPages: collectionsStateData.totalPages,
      haveNextPage: collectionsStateData.haveNextPage,
      handleSortChange: collectionsStateData.handleSortChange,
      handlePageChange: collectionsStateData.handlePageChange,
      handleRetry: collectionsStateData.handleRetry,
      expandedCollectionId: collectionsStateData.expandedCollectionId,
      toggleCollection: collectionsStateData.toggleCollection,
      emptyStateCopy: COLLECTIONS_EMPTY_STATE_COPY,
      clearFiltersLabel: COLLECTIONS_CLEAR_FILTERS_LABEL,
      searchQuery: "",
      handleSearchChange: () => {
        /* no-op */
      },
      ownershipFilter: "all",
      handleOwnershipFilterChange: () => {
        /* no-op */
      },
      discoveryFilter: "none",
      handleDiscoveryFilterChange: () => {
        /* no-op */
      },
      handleResetFilters: collectionsStateData.handleClearFilters,
    }),
    [collectionsStateData, profileId],
  );

  const nftsViewState = useMemo<XtdhReceivedNftsViewState>(
    () => ({
      missingScopeMessage: profileId ? undefined : MISSING_SCOPE_MESSAGE,
      isLoading: nftsStateData.isLoading,
      isFetching: nftsStateData.isFetching,
      isError: nftsStateData.isError,
      errorMessage:
        nftsStateData.error instanceof Error ? nftsStateData.error.message : undefined,
      nfts: nftsStateData.nfts,
      activeSort: nftsStateData.activeSort,
      activeDirection: nftsStateData.activeDirection,
      collectionFilterOptions: nftsStateData.collectionFilterOptions,
      filtersAreActive: nftsStateData.filtersAreActive,
      selectedCollections: nftsStateData.selectedCollections,
      resultSummary: nftsStateData.resultSummary,
      page: nftsStateData.page,
      totalPages: nftsStateData.totalPages,
      haveNextPage: nftsStateData.haveNextPage,
      handleSortChange: nftsStateData.handleSortChange,
      handleCollectionsFilterChange:
        nftsStateData.handleCollectionsFilterChange,
      handleClearFilters: nftsStateData.handleClearFilters,
      handlePageChange: nftsStateData.handlePageChange,
      handleRetry: nftsStateData.handleRetry,
      clearFiltersLabel: NFTS_CLEAR_FILTERS_LABEL,
      emptyStateCopy: NFTS_EMPTY_STATE_COPY,
      searchQuery: "",
      handleSearchChange: () => {
        /* no-op */
      },
      ownershipFilter: "all",
      handleOwnershipFilterChange: () => {
        /* no-op */
      },
      discoveryFilter: "none",
      handleDiscoveryFilterChange: () => {
        /* no-op */
      },
    }),
    [nftsStateData, profileId],
  );


  return (
    <XtdhReceivedSection
      view={view}
      onViewChange={handleViewChange}
      collectionsState={collectionsViewState}
      nftsState={nftsViewState}
    />
  );
}
