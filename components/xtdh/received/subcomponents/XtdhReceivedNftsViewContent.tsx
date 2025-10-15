'use client';

import { useCallback, useMemo, useState } from "react";

import CollectionsAutocomplete from "@/components/utils/input/collections/CollectionsAutocomplete";
import CommonSelect from "@/components/utils/select/CommonSelect";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";

import {
  XTDH_NFT_SORT_ITEMS,
  type XtdhNftSortField,
  type XtdhReceivedView,
} from "../utils/constants";
import { XtdhReceivedEmptyState } from "./XtdhReceivedEmptyState";
import { XtdhReceivedNftSkeleton } from "./XtdhReceivedNftSkeleton";
import { XtdhReceivedViewToggle } from "./XtdhReceivedViewToggle";
import { XtdhReceivedTokenRow } from "./XtdhReceivedTokenRow";
import { XtdhReceivedCollectionTokenDetailsDrawer } from "../collection-card-content/subcomponents/XtdhReceivedCollectionTokenDetailsDrawer";
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
    collectionFilterOptions,
    selectedCollections,
    handleCollectionsFilterChange,
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
      <div
        className="tw-flex tw-flex-col tw-gap-3"
        role="region"
        aria-label="Filter and sort controls"
      >
        <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-gap-4">
          <div className="tw-w-full lg:tw-w-64">
            <CollectionsAutocomplete
              options={collectionFilterOptions}
              value={selectedCollections}
              onChange={handleCollectionsFilterChange}
              disabled={isLoading || isFetching}
            />
          </div>
          <div className="tw-w-full lg:tw-w-auto">
            <CommonSelect<XtdhNftSortField>
              items={XTDH_NFT_SORT_ITEMS}
              activeItem={activeSort}
              filterLabel="Sort NFTs"
              setSelected={handleSortChange}
              sortDirection={activeDirection}
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
          <span
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="tw-text-sm tw-text-iron-300"
          >
            {resultSummary}
          </span>
          <div className="tw-flex tw-justify-end sm:tw-justify-end">
            <XtdhReceivedViewToggle
              view={view}
              onViewChange={onViewChange}
              announcement={announcement}
            />
          </div>
        </div>
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
