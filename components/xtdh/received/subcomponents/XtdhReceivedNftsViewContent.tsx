'use client';

import { useCallback, useMemo, useState } from "react";

import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";

import {
  XTDH_NFT_SORT_ITEMS,
  type XtdhNftSortField,
  type XtdhReceivedView,
} from "../utils/constants";
import { XtdhReceivedEmptyState } from "./XtdhReceivedEmptyState";
import { XtdhReceivedNftSkeleton } from "./XtdhReceivedNftSkeleton";
import { XtdhReceivedTokenRow } from "./XtdhReceivedTokenRow";
import { XtdhReceivedCollectionTokenDetailsDrawer } from "../collection-card-content/subcomponents/XtdhReceivedCollectionTokenDetailsDrawer";
import { XtdhReceivedCollectionsControls } from "./XtdhReceivedCollectionsControls";
import type {
  XtdhReceivedNftsViewEmptyCopy,
  XtdhReceivedNftsViewState,
} from "./XtdhReceivedNftsView.types";

interface XtdhReceivedNftsViewContentProps {
  readonly view: XtdhReceivedView;
  readonly onViewChange: (view: XtdhReceivedView) => void;
  readonly announcement: string;
  readonly state: XtdhReceivedNftsViewState;
  readonly clearFiltersLabel: string;
  readonly emptyStateCopy: XtdhReceivedNftsViewEmptyCopy;
  readonly shouldShowPagination: boolean;
}

export function XtdhReceivedNftsViewContent({
  view,
  onViewChange,
  announcement,
  state,
  clearFiltersLabel,
  emptyStateCopy,
  shouldShowPagination,
}: XtdhReceivedNftsViewContentProps) {
  const {
    nfts,
    isLoading,
    isFetching,
    activeSort,
    activeDirection,
    handleSortChange,
    filtersAreActive,
    handleClearFilters,
    resultSummary,
    page,
    haveNextPage,
    totalPages,
    handlePageChange,
    searchQuery,
    handleSearchChange,
    ownershipFilter,
    handleOwnershipFilterChange,
    discoveryFilter,
    handleDiscoveryFilterChange,
  } = state;

  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);
  const activeToken = useMemo(
    () => nfts.find((nft) => nft.tokenId === activeTokenId) ?? null,
    [nfts, activeTokenId],
  );

  const handleTokenSelect = useCallback((tokenId: string) => {
    setActiveTokenId((previous) => (previous === tokenId ? null : tokenId));
  }, []);

  const handleCloseDetails = useCallback(() => {
    setActiveTokenId(null);
  }, []);

  const detailsRegionId = "xtdh-received-nfts-details";

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
        sortItems={XTDH_NFT_SORT_ITEMS}
        sortLabel="Sort tokens"
        searchLabel="Search tokens"
        searchPlaceholder="Search tokens..."
      />

      <div className="hidden md:block">
        <CommonTabs<XtdhNftSortField>
          items={XTDH_NFT_SORT_ITEMS}
          activeItem={activeSort}
          filterLabel="Sort tokens"
          setSelected={handleSortChange}
          sortDirection={activeDirection}
          disabled={isLoading}
        />
      </div>

      {isLoading ? (
        <XtdhReceivedNftSkeleton />
      ) : nfts.length === 0 ? (
        filtersAreActive ? (
          <XtdhReceivedEmptyState
            message={emptyStateCopy.filteredMessage}
            actionLabel={emptyStateCopy.filteredActionLabel ?? clearFiltersLabel}
            onAction={handleClearFilters}
          />
        ) : (
          <XtdhReceivedEmptyState
            message={emptyStateCopy.defaultMessage}
          />
        )
      ) : (
        <>
          <div
            className="tw-overflow-hidden tw-rounded-2xl tw-border tw-border-iron-900/70 tw-bg-iron-975/25"
            role="table"
            aria-label="NFTs receiving xTDH"
          >
            <div role="rowgroup">
              {nfts.map((nft) => (
                <XtdhReceivedTokenRow
                  key={nft.tokenId}
                  nft={nft}
                  isActive={nft.tokenId === activeTokenId}
                  detailsRegionId={detailsRegionId}
                  onSelect={handleTokenSelect}
                />
              ))}
            </div>
          </div>
          {activeToken && (
            <XtdhReceivedCollectionTokenDetailsDrawer
              token={activeToken}
              detailsRegionId={detailsRegionId}
              onClose={handleCloseDetails}
            />
          )}
        </>
      )}

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
