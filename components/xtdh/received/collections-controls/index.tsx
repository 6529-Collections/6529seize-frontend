import CommonSelect from "@/components/utils/select/CommonSelect";
import type { XtdhCollectionsSortField } from "@/hooks/useXtdhCollectionsQuery";
import { SortDirection } from "@/entities/ISort";

import {
  COLLECTION_SORT_ITEMS,
} from "../constants";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface XtdhCollectionsControlsProps {
  readonly activeSortField: XtdhCollectionsSortField;
  readonly activeSortDirection: SortDirection;
  readonly onSortChange: (sort: XtdhCollectionsSortField) => void;
  readonly searchTerm: string;
  readonly onSearchChange: (term: string) => void;

  readonly isDisabled?: boolean;
}

export function XtdhCollectionsControls({
  activeSortField,
  activeSortDirection,
  onSortChange,
  searchTerm,
  onSearchChange,

  isDisabled = false,
}: Readonly<XtdhCollectionsControlsProps>) {
  return (
    <section className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between tw-px-6" aria-label="Sort and search received collections">
      <div className="tw-relative tw-w-full sm:tw-max-w-xs md:tw-max-w-sm">
        <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-flex tw-items-center tw-pl-3">
          <MagnifyingGlassIcon className="tw-h-5 tw-w-5 tw-text-iron-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={isDisabled}
          placeholder="Search collections..."
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-2.5 tw-pl-10 tw-pr-3 tw-text-iron-100 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 hover:tw-ring-iron-600 focus:tw-bg-transparent focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-text-sm sm:tw-leading-6 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 tw-transition tw-duration-300 tw-ease-out"
        />
      </div>
      <div className="tw-w-full sm:tw-w-auto tw-overflow-x-auto horizontal-menu-hide-scrollbar">
        <CommonSelect
          items={COLLECTION_SORT_ITEMS}
          activeItem={activeSortField}
          filterLabel="Sort collections by"
          setSelected={onSortChange}
          sortDirection={activeSortDirection}
          disabled={isDisabled}
          fill={false}
        />
      </div>

    </section>
  );
}


