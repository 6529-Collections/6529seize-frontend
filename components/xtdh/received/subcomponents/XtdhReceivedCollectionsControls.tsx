"use client";

import { useCallback } from "react";

import CommonInput from "@/components/utils/input/CommonInput";
import CommonSelect from "@/components/utils/select/CommonSelect";
import type { SortDirection } from "@/entities/ISort";
import {
  XTDH_COLLECTION_SORT_ITEMS,
  type XtdhCollectionOwnershipFilter,
  type XtdhCollectionsSortField,
  type XtdhReceivedView,
} from "../utils/constants";
import { XtdhReceivedViewToggle } from "./XtdhReceivedViewToggle";

export interface XtdhReceivedCollectionsControlsProps {
  readonly resultSummary: string;
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly ownershipFilter: XtdhCollectionOwnershipFilter;
  readonly onOwnershipFilterChange: (filter: XtdhCollectionOwnershipFilter) => void;
  readonly isMyAllocationsActive: boolean;
  readonly onToggleMyAllocations: () => void;
  readonly isTrendingActive: boolean;
  readonly onToggleTrending: () => void;
  readonly isNewlyAllocatedActive: boolean;
  readonly onToggleNewlyAllocated: () => void;
  readonly activeFilters: readonly string[];
  readonly filtersAreActive: boolean;
  readonly isLoading: boolean;
  readonly activeSort: XtdhCollectionsSortField;
  readonly activeDirection: SortDirection;
  readonly onSortChange: (nextSort: XtdhCollectionsSortField) => void;
  readonly onResetFilters: () => void;
  readonly view: XtdhReceivedView;
  readonly onViewChange: (view: XtdhReceivedView) => void;
  readonly announcement: string;
  readonly clearFiltersLabel: string;
}

export function XtdhReceivedCollectionsControls({
  resultSummary,
  searchQuery,
  onSearchChange,
  ownershipFilter,
  onOwnershipFilterChange,
  isMyAllocationsActive,
  onToggleMyAllocations,
  isTrendingActive,
  onToggleTrending,
  isNewlyAllocatedActive,
  onToggleNewlyAllocated,
  activeFilters,
  filtersAreActive,
  isLoading,
  activeSort,
  activeDirection,
  onSortChange,
  onResetFilters,
  view,
  onViewChange,
  announcement,
  clearFiltersLabel,
}: XtdhReceivedCollectionsControlsProps) {
  const buildToggleClasses = (active: boolean) =>
    `tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-transition tw-duration-200 ${
      active
        ? "tw-border-primary-500 tw-bg-primary-500/20 tw-text-primary-200 hover:tw-border-primary-400"
        : "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-300 hover:tw-border-iron-600"
    }`;

  const handleSearchInput = useCallback(
    (value: string | null) => {
      onSearchChange(value ?? "");
    },
    [onSearchChange],
  );

  return (
    <div
      className="tw-flex tw-flex-col tw-gap-3"
      role="region"
      aria-label="Filter and sort controls"
    >
      <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-gap-4">
        <div className="tw-w-full lg:tw-flex-1">
          <CommonInput
            value={searchQuery}
            onChange={handleSearchInput}
            placeholder="Search collections or creators"
            showSearchIcon={true}
            disabled={isLoading}
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
            onClick={onResetFilters}
            className="tw-self-start tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
          >
            {clearFiltersLabel}
          </button>
        )}
      </div>

      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <button
          type="button"
          onClick={() => onOwnershipFilterChange("granted")}
          aria-pressed={ownershipFilter === "granted"}
          className={buildToggleClasses(ownershipFilter === "granted")}
        >
          I Have Granted
        </button>
        <button
          type="button"
          onClick={() => onOwnershipFilterChange("received")}
          aria-pressed={ownershipFilter === "received"}
          className={buildToggleClasses(ownershipFilter === "received")}
        >
          I Have Received
        </button>
      </div>

      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <button
          type="button"
          onClick={onToggleTrending}
          aria-pressed={isTrendingActive}
          className={buildToggleClasses(isTrendingActive)}
        >
          🔥 Trending (7d)
        </button>
        <button
          type="button"
          onClick={onToggleNewlyAllocated}
          aria-pressed={isNewlyAllocatedActive}
          className={buildToggleClasses(isNewlyAllocatedActive)}
        >
          🆕 Newly Allocated
        </button>
        <button
          type="button"
          onClick={onToggleMyAllocations}
          aria-pressed={isMyAllocationsActive}
          className={buildToggleClasses(isMyAllocationsActive)}
        >
          👤 My Allocations
        </button>
      </div>

      {activeFilters.length > 0 && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
            Active Filters
          </span>
          {activeFilters.map((label) => (
            <span
              key={label}
              className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-200"
            >
              {label}
            </span>
          ))}
        </div>
      )}

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
