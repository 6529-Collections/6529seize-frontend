'use client';

import CollectionsAutocomplete from "@/components/utils/input/collections/CollectionsAutocomplete";
import CommonSelect from "@/components/utils/select/CommonSelect";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import {
  NFT_SORT_ITEMS,
  type NftSortField,
  type ReceivedView,
} from "../constants";
import { useUserPageXtdhReceivedNftsState } from "../hooks";
import { UserPageXtdhReceivedEmptyState } from "./EmptyState";
import { UserPageXtdhReceivedErrorState } from "./ErrorState";
import { UserPageXtdhReceivedNftSkeleton } from "./NftSkeleton";
import { UserPageXtdhReceivedNftCard } from "./NftCard";
import { UserPageXtdhReceivedViewToggle } from "./ViewToggle";

export interface UserPageXtdhReceivedNftsViewProps {
  readonly profileId: string | null;
  readonly view: ReceivedView;
  readonly onViewChange: (view: ReceivedView) => void;
  readonly announcement: string;
}

export function UserPageXtdhReceivedNftsView({
  profileId,
  view,
  onViewChange,
  announcement,
}: UserPageXtdhReceivedNftsViewProps) {
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
    expandedTokens,
    toggleToken,
  } = useUserPageXtdhReceivedNftsState(profileId);

  if (!profileId) {
    return (
      <UserPageXtdhReceivedEmptyState message="Unable to determine which profile to load." />
    );
  }

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : "";
    return (
      <UserPageXtdhReceivedErrorState message={errorMessage} onRetry={handleRetry} />
    );
  }

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
            <CommonSelect<NftSortField>
              items={NFT_SORT_ITEMS}
              activeItem={activeSort}
              filterLabel="Sort NFTs"
              setSelected={handleSortChange}
              sortDirection={activeDirection}
              disabled={isLoading}
            />
          </div>
          {filtersAreActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="tw-self-start tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
            >
              Clear filters
            </button>
          )}
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
            <UserPageXtdhReceivedViewToggle
              view={view}
              onViewChange={onViewChange}
              announcement={announcement}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <UserPageXtdhReceivedNftSkeleton />
      ) : nfts.length === 0 ? (
        filtersAreActive ? (
          <UserPageXtdhReceivedEmptyState
            message="No NFTs match your filters."
            actionLabel="Clear filters"
            onAction={handleClearFilters}
          />
        ) : (
          <UserPageXtdhReceivedEmptyState message="You don't hold any NFTs currently receiving xTDH grants. When others grant xTDH to collections you hold, they will appear here." />
        )
      ) : (
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-3" role="list" aria-label="NFTs receiving xTDH">
          {nfts.map((nft) => (
            <UserPageXtdhReceivedNftCard
              key={nft.tokenId}
              nft={nft}
              expanded={!!expandedTokens[nft.tokenId]}
              onToggle={() => toggleToken(nft.tokenId)}
            />
          ))}
        </div>
      )}

      {nfts.length > 0 && totalPages > 1 && (
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
