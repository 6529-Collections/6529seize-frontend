"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import clsx from "clsx";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faSliders,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import CommonInput from "@/components/utils/input/CommonInput";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import type { SortDirection } from "@/entities/ISort";
import {
  XTDH_COLLECTION_DISCOVERY_CONFIG,
  XTDH_COLLECTION_OWNERSHIP_LABELS,
  XTDH_COLLECTION_SORT_ITEMS,
  XTDH_MY_ALLOCATIONS_ICON,
  XTDH_MY_ALLOCATIONS_LABEL,
  type XtdhCollectionOwnershipFilter,
  type XtdhCollectionsSortField,
  type XtdhReceivedView,
} from "../utils/constants";
import { XtdhReceivedViewToggle } from "./XtdhReceivedViewToggle";
import type { XtdhActiveFilterChip } from "./XtdhReceivedCollectionsView.types";

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
  readonly activeFilters: readonly XtdhActiveFilterChip[];
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

const OWNERSHIP_SEGMENT_OPTIONS: ReadonlyArray<{
  readonly value: Extract<XtdhCollectionOwnershipFilter, "granted" | "received">;
  readonly label: string;
}> = [
  { value: "granted", label: XTDH_COLLECTION_OWNERSHIP_LABELS.granted },
  { value: "received", label: XTDH_COLLECTION_OWNERSHIP_LABELS.received },
];

interface DiscoveryToggleButtonProps {
  readonly label: string;
  readonly icon: IconDefinition;
  readonly active: boolean;
  readonly disabled: boolean;
  readonly onClick: () => void;
}

function DiscoveryToggleButton({
  label,
  icon,
  active,
  disabled,
  onClick,
}: DiscoveryToggleButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        "tw-relative tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-px-3.5 tw-py-2 tw-text-sm tw-font-semibold tw-transition-colors tw-duration-200 tw-min-h-[44px] focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400",
        active
          ? "tw-border-primary-500 tw-bg-primary-500/20 tw-text-primary-200"
          : "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 hover:tw-border-iron-500",
        disabled && "tw-cursor-not-allowed tw-opacity-60",
      )}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      <FontAwesomeIcon icon={icon} className="tw-h-4 tw-w-4" />
      <span>{label}</span>
    </button>
  );
}

interface OwnershipSegmentedControlProps {
  readonly value: XtdhCollectionOwnershipFilter;
  readonly onChange: (next: XtdhCollectionOwnershipFilter) => void;
  readonly disabled: boolean;
}

function OwnershipSegmentedControl({
  value,
  onChange,
  disabled,
}: OwnershipSegmentedControlProps) {
  return (
    <div
      className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-1"
      role="group"
      aria-label="Relationship filter"
    >
      {OWNERSHIP_SEGMENT_OPTIONS.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={clsx(
              "tw-flex-1 tw-rounded-full tw-border tw-border-transparent tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-min-w-[96px] tw-min-h-[44px] tw-whitespace-nowrap tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400",
              isActive
                ? "tw-border-primary-500 tw-bg-primary-500/20 tw-text-primary-200"
                : "tw-text-iron-200 hover:tw-bg-iron-800",
              disabled && "tw-cursor-not-allowed tw-opacity-60",
            )}
            aria-pressed={isActive}
            disabled={disabled}
            onClick={() => {
              if (disabled) {
                return;
              }
              onChange(isActive ? "all" : option.value);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

interface ActiveFiltersChipsProps {
  readonly filters: readonly XtdhActiveFilterChip[];
  readonly className?: string;
}

function ActiveFiltersChips({ filters, className }: ActiveFiltersChipsProps) {
  if (!filters.length) {
    return null;
  }

  return (
    <div
      className={clsx(
        "tw-flex tw-flex-wrap tw-items-center tw-gap-2",
        className,
      )}
    >
      <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
        Active Filters
      </span>
      {filters.map(({ label, onRemove }, index) => {
        const key = `${label}-${index}`;
        if (onRemove) {
          return (
            <button
              key={key}
              type="button"
              className="tw-inline-flex tw-min-h-[44px] tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-iron-100 tw-transition-colors tw-duration-200 hover:tw-border-iron-500 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              onClick={onRemove}
            >
              <span>{label}</span>
              <FontAwesomeIcon icon={faXmark} className="tw-h-3 tw-w-3" />
              <span className="tw-sr-only">Remove {label}</span>
            </button>
          );
        }

        return (
          <span
            key={key}
            className="tw-inline-flex tw-min-h-[44px] tw-items-center tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-iron-100"
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

interface MobileSearchDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly value: string;
  readonly onChange: (value: string | null) => void;
  readonly isLoading: boolean;
}

function MobileSearchDialog({
  isOpen,
  onClose,
  value,
  onChange,
  isLoading,
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
                  Search collections
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
                  placeholder="Search collections..."
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
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false);

  const handleSearchInput = useCallback(
    (value: string | null) => {
      onSearchChange(value ?? "");
    },
    [onSearchChange],
  );

  const discoveryToggles = useMemo(
    () => [
      {
        key: "trending" as const,
        label: XTDH_COLLECTION_DISCOVERY_CONFIG.trending.label,
        icon: XTDH_COLLECTION_DISCOVERY_CONFIG.trending.icon,
        active: isTrendingActive,
        onClick: onToggleTrending,
      },
      {
        key: "newly_allocated" as const,
        label: XTDH_COLLECTION_DISCOVERY_CONFIG.newly_allocated.label,
        icon: XTDH_COLLECTION_DISCOVERY_CONFIG.newly_allocated.icon,
        active: isNewlyAllocatedActive,
        onClick: onToggleNewlyAllocated,
      },
      {
        key: "mine" as const,
        label: XTDH_MY_ALLOCATIONS_LABEL,
        icon: XTDH_MY_ALLOCATIONS_ICON,
        active: isMyAllocationsActive,
        onClick: onToggleMyAllocations,
      },
    ],
    [
      isTrendingActive,
      onToggleTrending,
      isNewlyAllocatedActive,
      onToggleNewlyAllocated,
      isMyAllocationsActive,
      onToggleMyAllocations,
    ],
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

        <div className="hidden md:flex md:flex-col md:gap-5">
          <div className="tw-flex tw-flex-wrap md:tw:flex-nowrap tw-items-center tw-gap-3 xl:tw-gap-4">
            <div className="tw-min-w-[220px] tw-max-w-[420px] tw-flex-shrink-0">
              <CommonInput
                value={searchQuery}
                onChange={handleSearchInput}
                placeholder="Search collections..."
                showSearchIcon={true}
                disabled={isLoading}
              />
            </div>
            <div className="tw-flex-1" />
            <div className="tw-flex-shrink-0">
              <XtdhReceivedViewToggle
                view={view}
                onViewChange={onViewChange}
                announcement={announcement}
              />
            </div>
          </div>

          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-gap-y-3 xl:tw-gap-x-3">
            <OwnershipSegmentedControl
              value={ownershipFilter}
              onChange={onOwnershipFilterChange}
              disabled={isLoading}
            />
            <div className="tw-flex tw-flex-1 tw-flex-wrap tw-items-center tw-gap-2">
              {discoveryToggles.map((toggle) => (
                <DiscoveryToggleButton
                  key={toggle.key}
                  label={toggle.label}
                  icon={toggle.icon}
                  active={toggle.active}
                  disabled={isLoading}
                  onClick={toggle.onClick}
                />
              ))}
            </div>
            {filtersAreActive && (
              <button
                type="button"
                onClick={onResetFilters}
                className="tw-inline-flex tw-min-h-[44px] tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-700 tw-bg-transparent tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-200 tw-transition tw-duration-200 hover:tw-border-iron-500 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 tw-ml-auto"
              >
                {clearFiltersLabel}
              </button>
            )}
          </div>
        </div>

        <ActiveFiltersChips filters={activeFilters} />

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
            <OwnershipSegmentedControl
              value={ownershipFilter}
              onChange={onOwnershipFilterChange}
              disabled={isLoading}
            />
          </section>

          <section className="tw-flex tw-flex-col tw-gap-3">
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
              Discovery
            </span>
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              {discoveryToggles.map((toggle) => (
                <DiscoveryToggleButton
                  key={toggle.key}
                  label={toggle.label}
                  icon={toggle.icon}
                  active={toggle.active}
                  disabled={isLoading}
                  onClick={toggle.onClick}
                />
              ))}
            </div>
          </section>

          <ActiveFiltersChips filters={activeFilters} />

          <div className="tw-flex tw-justify-between tw-gap-3">
            <button
              type="button"
              onClick={onResetFilters}
              className="tw-inline-flex tw-flex-1 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-700 tw-bg-transparent tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-200 hover:tw-border-iron-500 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 tw-transition tw-duration-200"
            >
              {clearFiltersLabel}
            </button>
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
