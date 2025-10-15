"use client";

import { Fragment, useCallback, useState } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faSliders,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import CommonInput from "@/components/utils/input/CommonInput";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import type { SortDirection } from "@/entities/ISort";
import {
  XTDH_COLLECTION_DISCOVERY_TABS,
  XTDH_COLLECTION_OWNERSHIP_TABS,
  XTDH_COLLECTION_SORT_ITEMS,
  type XtdhCollectionOwnershipFilter,
  type XtdhCollectionsDiscoveryFilter,
  type XtdhCollectionsSortField,
  type XtdhReceivedView,
} from "../utils/constants";
import { XtdhReceivedViewToggle } from "./XtdhReceivedViewToggle";

const DEFAULT_SEARCH_LABEL = "Search collections";
const DEFAULT_SEARCH_PLACEHOLDER = "Search collections...";
const DEFAULT_SORT_LABEL = "Sort collections";

export interface XtdhReceivedCollectionsControlsProps<
  TSort extends string = XtdhCollectionsSortField,
> {
  readonly resultSummary: string;
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly ownershipFilter: XtdhCollectionOwnershipFilter;
  readonly onOwnershipFilterChange: (filter: XtdhCollectionOwnershipFilter) => void;
  readonly discoveryFilter: XtdhCollectionsDiscoveryFilter;
  readonly onDiscoveryFilterChange: (
    filter: XtdhCollectionsDiscoveryFilter,
  ) => void;
  readonly filtersAreActive: boolean;
  readonly isLoading: boolean;
  readonly activeSort: TSort;
  readonly activeDirection: SortDirection;
  readonly onSortChange: (nextSort: TSort) => void;
  readonly view: XtdhReceivedView;
  readonly onViewChange: (view: XtdhReceivedView) => void;
  readonly announcement: string;
  readonly sortItems?: ReadonlyArray<CommonSelectItem<TSort>>;
  readonly sortLabel?: string;
  readonly searchLabel?: string;
  readonly searchPlaceholder?: string;
}

interface MobileSearchDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly value: string;
  readonly onChange: (value: string | null) => void;
  readonly isLoading: boolean;
  readonly label: string;
  readonly placeholder: string;
}

function MobileSearchDialog({
  isOpen,
  onClose,
  value,
  onChange,
  isLoading,
  label,
  placeholder,
}: MobileSearchDialogProps) {
  return (
    <Transition appear={true} show={isOpen} as={Fragment}>
      <Dialog as="div" className="tw-relative tw-z-[1010]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="tw-ease-out tw-duration-150"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-ease-in tw-duration-100"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
        >
          <div className="tw-fixed tw-inset-0 tw-bg-black/60" aria-hidden="true" />
        </TransitionChild>

        <div className="tw-fixed tw-inset-0 tw-flex tw-items-start tw-justify-center tw-px-4 tw-pt-16 tw-pb-8">
          <TransitionChild
            as={Fragment}
            enter="tw-ease-out tw-duration-200 tw-transform"
            enterFrom="tw-translate-y-4 tw-opacity-0"
            enterTo="tw-translate-y-0 tw-opacity-100"
            leave="tw-ease-in tw-duration-150 tw-transform"
            leaveFrom="tw-translate-y-0 tw-opacity-100"
            leaveTo="tw-translate-y-4 tw-opacity-0"
          >
            <DialogPanel className="tw-w-full tw-max-w-lg tw-rounded-2xl tw-bg-iron-950 tw-p-4 tw-shadow-xl tw-ring-1 tw-ring-iron-800">
              <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
                <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
                  {label}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-text-iron-200 hover:tw-text-iron-50 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                >
                  <FontAwesomeIcon icon={faXmark} className="tw-h-4 tw-w-4" />
                  <span className="tw-sr-only">Close search</span>
                </button>
              </div>
              <div className="tw-mt-4">
                <CommonInput
                  value={value}
                  onChange={onChange}
                  placeholder={placeholder}
                  showSearchIcon={true}
                  disabled={isLoading}
                />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

export function XtdhReceivedCollectionsControls<
  TSort extends string = XtdhCollectionsSortField,
>({
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
  sortItems,
  sortLabel,
  searchLabel,
  searchPlaceholder,
}: XtdhReceivedCollectionsControlsProps<TSort>) {
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false);
  const resolvedSortItems =
    (sortItems ??
      XTDH_COLLECTION_SORT_ITEMS) as ReadonlyArray<CommonSelectItem<TSort>>;
  const resolvedSortLabel = sortLabel ?? DEFAULT_SORT_LABEL;
  const resolvedSearchLabel = searchLabel ?? DEFAULT_SEARCH_LABEL;
  const resolvedSearchPlaceholder = searchPlaceholder ?? DEFAULT_SEARCH_PLACEHOLDER;

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
        <div className="tw-flex tw-items-center tw-gap-2 md:tw-hidden">
          <button
            type="button"
            onClick={() => setIsSearchDialogOpen(true)}
            className="tw-inline-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 hover:tw-border-iron-500 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 md:tw-hidden"
            aria-label={resolvedSearchLabel}
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} className="tw-h-4 tw-w-4" />
          </button>

          <div className="tw-flex-1 tw-min-w-0">
            <CommonDropdown<TSort>
              items={resolvedSortItems}
              activeItem={activeSort}
              filterLabel={resolvedSortLabel}
              setSelected={onSortChange}
              sortDirection={activeDirection}
              disabled={isLoading}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsFiltersDialogOpen(true)}
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

        <div className="hidden md:flex md:flex-col md:gap-4">
          <div className="tw-flex tw-flex-wrap md:tw:flex-nowrap tw-items-center tw-gap-3 xl:tw-gap-4">
            <div className="tw-min-w-[220px] tw-max-w-[360px] tw-flex-shrink-0">
              <CommonInput
                value={searchQuery}
                onChange={handleSearchInput}
                placeholder={resolvedSearchPlaceholder}
                showSearchIcon={true}
                disabled={isLoading}
              />
            </div>
            <div className="tw-flex-1 tw-flex tw-items-center tw-gap-3">
              <div className="tw-flex-1">
                <CommonTabs<XtdhCollectionOwnershipFilter>
                  items={XTDH_COLLECTION_OWNERSHIP_TABS}
                  activeItem={ownershipFilter}
                  filterLabel="Relationship filter"
                  setSelected={onOwnershipFilterChange}
                  disabled={isLoading}
                />
              </div>
              <div className="tw-flex-1">
                <CommonTabs<XtdhCollectionsDiscoveryFilter>
                  items={XTDH_COLLECTION_DISCOVERY_TABS}
                  activeItem={discoveryFilter}
                  filterLabel="Discovery filter"
                  setSelected={onDiscoveryFilterChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="tw-flex-shrink-0 tw-ml-auto">
              <XtdhReceivedViewToggle
                view={view}
                onViewChange={onViewChange}
                announcement={announcement}
              />
            </div>
          </div>
        </div>

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

      <MobileSearchDialog
        isOpen={isSearchDialogOpen}
        onClose={() => setIsSearchDialogOpen(false)}
        value={searchQuery}
        onChange={handleSearchInput}
        isLoading={isLoading}
        label={resolvedSearchLabel}
        placeholder={resolvedSearchPlaceholder}
      />

      <MobileWrapperDialog
        title="Filters"
        isOpen={isFiltersDialogOpen}
        onClose={() => setIsFiltersDialogOpen(false)}
      >
        <div className="tw-flex tw-flex-col tw-gap-6 tw-px-4 tw-pb-6">
          <section className="tw-flex tw-flex-col tw-gap-3">
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
              Relationship
            </span>
            <CommonTabs<XtdhCollectionOwnershipFilter>
              items={XTDH_COLLECTION_OWNERSHIP_TABS}
              activeItem={ownershipFilter}
              filterLabel="Relationship filter"
              setSelected={onOwnershipFilterChange}
              disabled={isLoading}
            />
          </section>

          <section className="tw-flex tw-flex-col tw-gap-3">
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
              Discovery
            </span>
            <CommonTabs<XtdhCollectionsDiscoveryFilter>
              items={XTDH_COLLECTION_DISCOVERY_TABS}
              activeItem={discoveryFilter}
              filterLabel="Discovery filter"
              setSelected={onDiscoveryFilterChange}
              disabled={isLoading}
            />
          </section>

          <div className="tw-flex tw-justify-end tw-gap-3">
            <button
              type="button"
              onClick={() => setIsFiltersDialogOpen(false)}
              className="tw-inline-flex tw-flex-1 tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-primary-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 tw-transition tw-duration-200"
            >
              Apply
            </button>
          </div>
        </div>
      </MobileWrapperDialog>
    </>
  );
}
