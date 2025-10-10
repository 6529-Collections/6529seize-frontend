'use client';

import CollectionsAutocomplete from "@/components/utils/input/collections/CollectionsAutocomplete";
import CommonSelect from "@/components/utils/select/CommonSelect";
import type { SortDirection } from "@/entities/ISort";
import {
  XTDH_COLLECTION_SORT_ITEMS,
  type XtdhCollectionsSortField,
  type XtdhReceivedView,
} from "../utils/constants";
import { XtdhReceivedViewToggle } from "./XtdhReceivedViewToggle";

export interface XtdhReceivedCollectionsControlsProps {
  readonly resultSummary: string;
  readonly selectedCollections: string[];
  readonly collectionFilterOptions: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly tokenCount: number;
  }>;
  readonly filtersAreActive: boolean;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly activeSort: XtdhCollectionsSortField;
  readonly activeDirection: SortDirection;
  readonly onCollectionsFilterChange: (nextSelected: string[]) => void;
  readonly onSortChange: (nextSort: XtdhCollectionsSortField) => void;
  readonly onClearFilters: () => void;
  readonly view: XtdhReceivedView;
  readonly onViewChange: (view: XtdhReceivedView) => void;
  readonly announcement: string;
  readonly clearFiltersLabel: string;
}

export function XtdhReceivedCollectionsControls({
  resultSummary,
  selectedCollections,
  collectionFilterOptions,
  filtersAreActive,
  isLoading,
  isFetching,
  activeSort,
  activeDirection,
  onCollectionsFilterChange,
  onSortChange,
  onClearFilters,
  view,
  onViewChange,
  announcement,
  clearFiltersLabel,
}: XtdhReceivedCollectionsControlsProps) {
  return (
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
            onChange={onCollectionsFilterChange}
            disabled={isLoading || isFetching}
          />
        </div>
        <div className="tw-w-full lg:tw-w-auto">
          <CommonSelect<XtdhCollectionsSortField>
            items={XTDH_COLLECTION_SORT_ITEMS}
            activeItem={activeSort}
            filterLabel="Sort collections"
            setSelected={onSortChange}
            sortDirection={activeDirection}
            disabled={isLoading}
          />
        </div>
        {filtersAreActive && (
          <button
            type="button"
            onClick={onClearFilters}
            className="tw-self-start tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
          >
            {clearFiltersLabel}
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
  );
}
