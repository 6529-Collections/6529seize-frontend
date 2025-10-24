"use client";

import { useCallback, useState } from "react";

import type { XtdhReceivedCollectionsControlsProps } from "./types";
import { XtdhReceivedCollectionsDesktopControls } from "./subcomponents/XtdhReceivedCollectionsDesktopControls";
import { XtdhReceivedCollectionsFiltersDialog } from "./subcomponents/XtdhReceivedCollectionsFiltersDialog";
import { XtdhReceivedCollectionsMobileControls } from "./subcomponents/XtdhReceivedCollectionsMobileControls";
import { XtdhReceivedCollectionsMobileSearchDialog } from "./subcomponents/XtdhReceivedCollectionsMobileSearchDialog";

export function XtdhReceivedCollectionsControls({
  resultSummary,
  searchQuery,
  onSearchChange,
  ownershipFilter,
  onOwnershipFilterChange,
  discoveryFilter,
  onDiscoveryFilterChange,
  filtersAreActive,
  isLoading,
  activeSort,
  activeDirection,
  onSortChange,
  view,
  onViewChange,
  announcement,
}: XtdhReceivedCollectionsControlsProps) {
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false);

  const handleSearchInput = useCallback(
    (value: string | null) => {
      onSearchChange(value ?? "");
    },
    [onSearchChange],
  );

  return (
    <>
      <div
        className="tw-flex tw-flex-col tw-gap-4"
        role="region"
        aria-label="Filter and sort controls"
      >
        <XtdhReceivedCollectionsMobileControls
          onOpenSearch={() => setIsSearchDialogOpen(true)}
          onOpenFilters={() => setIsFiltersDialogOpen(true)}
          filtersAreActive={filtersAreActive}
          isFiltersDialogOpen={isFiltersDialogOpen}
          activeSort={activeSort}
          activeDirection={activeDirection}
          onSortChange={onSortChange}
          isLoading={isLoading}
          view={view}
          onViewChange={onViewChange}
          announcement={announcement}
        />

        <XtdhReceivedCollectionsDesktopControls
          searchQuery={searchQuery}
          onSearchChange={handleSearchInput}
          ownershipFilter={ownershipFilter}
          onOwnershipFilterChange={onOwnershipFilterChange}
          discoveryFilter={discoveryFilter}
          onDiscoveryFilterChange={onDiscoveryFilterChange}
          isLoading={isLoading}
          view={view}
          onViewChange={onViewChange}
          announcement={announcement}
        />

        <div className="tw-flex tw-flex-col tw-gap-2 md:tw-flex-row md:tw-items-center md:tw-justify-between">
          <span
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="tw-text-sm tw-text-iron-300"
          >
            {resultSummary}
          </span>
        </div>
      </div>

      <XtdhReceivedCollectionsMobileSearchDialog
        isOpen={isSearchDialogOpen}
        onClose={() => setIsSearchDialogOpen(false)}
        value={searchQuery}
        onChange={handleSearchInput}
        isLoading={isLoading}
      />

      <XtdhReceivedCollectionsFiltersDialog
        isOpen={isFiltersDialogOpen}
        onClose={() => setIsFiltersDialogOpen(false)}
        ownershipFilter={ownershipFilter}
        onOwnershipFilterChange={onOwnershipFilterChange}
        discoveryFilter={discoveryFilter}
        onDiscoveryFilterChange={onDiscoveryFilterChange}
        isLoading={isLoading}
      />
    </>
  );
}

export type { XtdhReceivedCollectionsControlsProps } from "./types";
