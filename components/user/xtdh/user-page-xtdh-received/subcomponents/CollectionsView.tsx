'use client';

import CollectionsAutocomplete from "@/components/utils/input/collections/CollectionsAutocomplete";
import CommonSelect from "@/components/utils/select/CommonSelect";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import {
  COLLECTION_SORT_ITEMS,
  type CollectionsSortField,
  type ReceivedView,
} from "../constants";
import { useUserPageXtdhReceivedCollectionsState } from "../hooks";
import { UserPageXtdhReceivedCollectionCard } from "./CollectionCard";
import { UserPageXtdhReceivedEmptyState } from "./EmptyState";
import { UserPageXtdhReceivedErrorState } from "./ErrorState";
import { UserPageXtdhReceivedCollectionsSkeleton } from "./CollectionsSkeleton";
import { UserPageXtdhReceivedViewToggle } from "./ViewToggle";

export interface UserPageXtdhReceivedCollectionsViewProps {
  readonly profileId: string | null;
  readonly view: ReceivedView;
  readonly onViewChange: (view: ReceivedView) => void;
  readonly announcement: string;
}

export function UserPageXtdhReceivedCollectionsView({
  profileId,
  view,
  onViewChange,
  announcement,
}: UserPageXtdhReceivedCollectionsViewProps) {
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
    expandedTokens,
    toggleToken,
  } = useUserPageXtdhReceivedCollectionsState(profileId);

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
            <CommonSelect<CollectionsSortField>
              items={COLLECTION_SORT_ITEMS}
              activeItem={activeSort}
              filterLabel="Sort collections"
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
        <UserPageXtdhReceivedCollectionsSkeleton />
      ) : collections.length === 0 ? (
        filtersAreActive ? (
          <UserPageXtdhReceivedEmptyState
            message="No collections match your filters."
            actionLabel="Clear filters"
            onAction={handleClearFilters}
          />
        ) : (
          <UserPageXtdhReceivedEmptyState message="You haven't received any xTDH grants for your collections yet. Once granters allocate xTDH to collections you hold, they will appear here." />
        )
      ) : (
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-3" role="list" aria-label="Collections receiving xTDH">
          {collections.map((collection) => (
            <UserPageXtdhReceivedCollectionCard
              key={collection.collectionId}
              collection={collection}
              expanded={expandedCollectionId === collection.collectionId}
              onToggle={() => toggleCollection(collection.collectionId)}
              expandedTokens={expandedTokens}
              onToggleToken={toggleToken}
            />
          ))}
        </div>
      )}

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
