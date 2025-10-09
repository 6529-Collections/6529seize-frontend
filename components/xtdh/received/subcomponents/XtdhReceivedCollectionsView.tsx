'use client';

import CollectionsAutocomplete from "@/components/utils/input/collections/CollectionsAutocomplete";
import CommonSelect from "@/components/utils/select/CommonSelect";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import {
  XTDH_COLLECTION_SORT_ITEMS,
  type XtdhCollectionsSortField,
  type XtdhReceivedView,
} from "../utils/constants";
import { useXtdhReceivedCollectionsState } from "../hooks";
import { XtdhReceivedCollectionCard } from "./XtdhReceivedCollectionCard";
import { XtdhReceivedEmptyState } from "./XtdhReceivedEmptyState";
import { XtdhReceivedErrorState } from "./XtdhReceivedErrorState";
import { XtdhReceivedCollectionsSkeleton } from "./XtdhReceivedCollectionsSkeleton";
import { XtdhReceivedViewToggle } from "./XtdhReceivedViewToggle";

export interface XtdhReceivedCollectionsViewProps {
  readonly profileId: string | null;
  readonly view: XtdhReceivedView;
  readonly onViewChange: (view: XtdhReceivedView) => void;
  readonly announcement: string;
  readonly granterHrefBuilder?: (profileId: string) => string;
}

export function XtdhReceivedCollectionsView({
  profileId,
  view,
  onViewChange,
  announcement,
  granterHrefBuilder,
}: XtdhReceivedCollectionsViewProps) {
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

  if (!profileId) {
    return (
      <XtdhReceivedEmptyState message="Unable to determine which profile to load." />
    );
  }

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : "";
    return (
      <XtdhReceivedErrorState message={errorMessage} onRetry={handleRetry} />
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
            <CommonSelect<XtdhCollectionsSortField>
              items={XTDH_COLLECTION_SORT_ITEMS}
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
            <XtdhReceivedViewToggle
              view={view}
              onViewChange={onViewChange}
              announcement={announcement}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <XtdhReceivedCollectionsSkeleton />
      ) : collections.length === 0 ? (
        filtersAreActive ? (
          <XtdhReceivedEmptyState
            message="No collections match your filters."
            actionLabel="Clear filters"
            onAction={handleClearFilters}
          />
        ) : (
          <XtdhReceivedEmptyState message="You haven't received any xTDH grants for your collections yet. Once granters allocate xTDH to collections you hold, they will appear here." />
        )
      ) : (
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-3" role="list" aria-label="Collections receiving xTDH">
          {collections.map((collection) => (
            <XtdhReceivedCollectionCard
              key={collection.collectionId}
              collection={collection}
              expanded={expandedCollectionId === collection.collectionId}
              onToggle={() => toggleCollection(collection.collectionId)}
              granterHrefBuilder={granterHrefBuilder}
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
