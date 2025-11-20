import CommonSelect from "@/components/utils/select/CommonSelect";
import type { XtdhCollectionsSortField } from "@/hooks/useXtdhCollectionsQuery";
import { SortDirection } from "@/entities/ISort";

import {
  COLLECTION_SORT_ITEMS,
  COLLECTION_SORT_LABELS,
} from "../constants";

interface XtdhCollectionsControlsProps {
  readonly activeSortField: XtdhCollectionsSortField;
  readonly activeSortDirection: SortDirection;
  readonly onSortChange: (sort: XtdhCollectionsSortField) => void;
  readonly resultSummary: string | null;
  readonly isDisabled?: boolean;
}

export function XtdhCollectionsControls({
  activeSortField,
  activeSortDirection,
  onSortChange,
  resultSummary,
  isDisabled = false,
}: Readonly<XtdhCollectionsControlsProps>) {
  return (
    <section className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between" aria-label="Sort received collections">
      <div className="tw-w-full lg:tw-flex-1 lg:tw-min-w-[16rem] tw-overflow-x-auto horizontal-menu-hide-scrollbar">
        <CommonSelect
          items={COLLECTION_SORT_ITEMS}
          activeItem={activeSortField}
          filterLabel="Sort collections by"
          setSelected={onSortChange}
          sortDirection={activeSortDirection}
          disabled={isDisabled}
        />
      </div>
      {resultSummary && (
        <output
          aria-live="polite"
          aria-atomic="true"
          className="tw-text-sm tw-text-iron-300"
        >
          {resultSummary}
        </output>
      )}
    </section>
  );
}

export function buildCollectionsResultSummary(
  collectionsCount: number,
  sortField: XtdhCollectionsSortField,
  direction: SortDirection
): string {
  const label = COLLECTION_SORT_LABELS[sortField];
  const dirLabel = direction === SortDirection.ASC ? "ascending" : "descending";
  const collectionLabel = collectionsCount === 1 ? "collection" : "collections";
  return `${collectionsCount.toLocaleString()} ${collectionLabel} · Sorted by ${label} (${dirLabel})`;
}
