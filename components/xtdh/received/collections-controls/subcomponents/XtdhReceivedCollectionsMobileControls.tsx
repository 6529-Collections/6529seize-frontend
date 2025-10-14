"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faSliders } from "@fortawesome/free-solid-svg-icons";

import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import type { SortDirection } from "@/entities/ISort";

import {
  XTDH_COLLECTION_SORT_ITEMS,
  type XtdhCollectionsSortField,
  type XtdhReceivedView,
} from "../../utils/constants";
import { XtdhReceivedViewToggle } from "../../subcomponents/XtdhReceivedViewToggle";

interface XtdhReceivedCollectionsMobileControlsProps {
  readonly onOpenSearch: () => void;
  readonly onOpenFilters: () => void;
  readonly filtersAreActive: boolean;
  readonly isFiltersDialogOpen: boolean;
  readonly activeSort: XtdhCollectionsSortField;
  readonly activeDirection: SortDirection;
  readonly onSortChange: (nextSort: XtdhCollectionsSortField) => void;
  readonly isLoading: boolean;
  readonly view: XtdhReceivedView;
  readonly onViewChange: (view: XtdhReceivedView) => void;
  readonly announcement: string;
}

export function XtdhReceivedCollectionsMobileControls({
  onOpenSearch,
  onOpenFilters,
  filtersAreActive,
  isFiltersDialogOpen,
  activeSort,
  activeDirection,
  onSortChange,
  isLoading,
  view,
  onViewChange,
  announcement,
}: XtdhReceivedCollectionsMobileControlsProps) {
  return (
    <div className="tw-flex tw-items-center tw-gap-2 md:tw-hidden">
      <button
        type="button"
        onClick={onOpenSearch}
        className="tw-inline-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 hover:tw-border-iron-500 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 md:tw-hidden"
        aria-label="Search collections"
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} className="tw-h-4 tw-w-4" />
      </button>

      <div className="tw-flex-1 tw-min-w-0">
        <CommonDropdown<XtdhCollectionsSortField>
          items={XTDH_COLLECTION_SORT_ITEMS}
          activeItem={activeSort}
          filterLabel="Sort collections"
          setSelected={onSortChange}
          sortDirection={activeDirection}
          disabled={isLoading}
        />
      </div>

      <button
        type="button"
        onClick={onOpenFilters}
        className="tw-relative tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-200 hover:tw-border-iron-500 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 md:tw-hidden"
        aria-haspopup="dialog"
        aria-expanded={isFiltersDialogOpen}
      >
        <FontAwesomeIcon icon={faSliders} className="tw-h-4 tw-w-4" />
        <span>Filters</span>
        {filtersAreActive && (
          <span
            aria-hidden="true"
            className="tw-absolute tw-right-2 tw-top-2 tw-h-2 tw-w-2 tw-rounded-full tw-bg-primary-400"
          />
        )}
      </button>

      <div className="tw-flex-shrink-0">
        <XtdhReceivedViewToggle
          view={view}
          onViewChange={onViewChange}
          announcement={announcement}
        />
      </div>
    </div>
  );
}
