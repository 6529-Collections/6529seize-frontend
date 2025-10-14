'use client';

import type { XtdhReceivedCollectionSummary } from "@/types/xtdh";
import { XtdhReceivedCollectionCard } from "./XtdhReceivedCollectionCard";
import { XtdhReceivedCollectionsSkeleton } from "./XtdhReceivedCollectionsSkeleton";
import { XtdhReceivedEmptyState } from "./XtdhReceivedEmptyState";
import type { XtdhReceivedCollectionsViewEmptyCopy } from "./XtdhReceivedCollectionsView.types";

export interface XtdhReceivedCollectionsListProps {
  readonly isLoading: boolean;
  readonly collections: XtdhReceivedCollectionSummary[];
  readonly filtersAreActive: boolean;
  readonly emptyStateCopy: XtdhReceivedCollectionsViewEmptyCopy;
  readonly onClearFilters: () => void;
  readonly expandedCollectionId: string | null;
  readonly onToggleCollection: (collectionId: string) => void;
  readonly clearFiltersLabel: string;
}

export function XtdhReceivedCollectionsList({
  isLoading,
  collections,
  filtersAreActive,
  emptyStateCopy,
  onClearFilters,
  expandedCollectionId,
  onToggleCollection,
  clearFiltersLabel,
}: XtdhReceivedCollectionsListProps) {
  if (isLoading) {
    return <XtdhReceivedCollectionsSkeleton />;
  }

  if (collections.length === 0) {
    if (filtersAreActive) {
      return (
        <XtdhReceivedEmptyState
          message={emptyStateCopy.filtersMessage}
          actionLabel={emptyStateCopy.filtersActionLabel ?? clearFiltersLabel}
          onAction={onClearFilters}
        />
      );
    }

    return <XtdhReceivedEmptyState message={emptyStateCopy.defaultMessage} />;
  }

  return (
    <div
      className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-3"
      role="list"
      aria-label="Collections receiving xTDH"
    >
      {collections.map((collection) => (
        <XtdhReceivedCollectionCard
          key={collection.collectionId}
          collection={collection}
          expanded={expandedCollectionId === collection.collectionId}
          onToggle={() => onToggleCollection(collection.collectionId)}
        />
      ))}
    </div>
  );
}
