"use client";

import { SortDirection } from "@/entities/ISort";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faChevronCircleDown,
  faChevronCircleUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactNode } from "react";

function CollectionSortButton<TSort extends string>({
  currentSort,
  sort,
  select,
  ariaLabel,
  children,
}: Readonly<{
  currentSort: TSort;
  sort: TSort;
  select: () => void;
  ariaLabel?: string | undefined;
  children?: ReactNode;
}>) {
  const isActive = currentSort === sort;

  return (
    <button
      type="button"
      onClick={select}
      aria-pressed={isActive}
      aria-label={ariaLabel}
      className={`tw-relative tw-m-0 tw-shrink-0 tw-cursor-pointer tw-whitespace-nowrap tw-border-0 tw-bg-transparent tw-px-0.5 tw-py-1 tw-text-sm tw-font-medium tw-leading-5 tw-no-underline tw-transition-colors tw-duration-200 after:tw-absolute after:-tw-bottom-0.5 after:tw-left-0 after:tw-h-px after:tw-w-full after:tw-origin-left after:tw-transition-transform after:tw-duration-200 after:tw-content-[''] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 sm:tw-shrink ${
        isActive
          ? "tw-text-white after:tw-scale-x-100 after:tw-bg-primary-400"
          : "tw-text-iron-500 after:tw-scale-x-0 after:tw-bg-iron-700 hover:tw-text-iron-200 hover:after:tw-scale-x-100"
      }`}
    >
      {children ?? sort}
    </button>
  );
}

export default function CollectionSortControls<TSort extends string>({
  ariaLabel,
  sortDirection,
  setSortDirection,
  currentSort,
  sortOptions,
  setSort,
  getSortLabel,
  sortByLabel = "Sort by",
  directionLegend = "Sort direction",
  ascendingLabel = "Sort ascending",
  descendingLabel = "Sort descending",
  getSortButtonAriaLabel,
  children,
}: Readonly<{
  ariaLabel: string;
  sortDirection: SortDirection | undefined;
  setSortDirection: (direction: SortDirection) => void;
  currentSort: TSort;
  sortOptions: readonly TSort[];
  setSort: (sort: TSort) => void;
  getSortLabel?: (sort: TSort) => ReactNode;
  sortByLabel?: string | undefined;
  directionLegend?: string | undefined;
  ascendingLabel?: string | undefined;
  descendingLabel?: string | undefined;
  getSortButtonAriaLabel?: (sort: TSort) => string;
  children?: ReactNode;
}>) {
  function printSortDirectionButton(
    direction: SortDirection,
    icon: IconDefinition,
    label: string
  ) {
    const isActive = sortDirection === direction;

    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={isActive}
        onClick={() => setSortDirection(direction)}
        className={`tw-m-0 tw-inline-flex tw-h-7 tw-w-6 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-transition tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${
          isActive
            ? "tw-bg-white/[0.06] tw-text-white"
            : "tw-text-iron-500 hover:tw-bg-white/[0.04] hover:tw-text-iron-200"
        }`}
      >
        <FontAwesomeIcon aria-hidden="true" icon={icon} className="tw-size-4" />
      </button>
    );
  }

  return (
    <section
      aria-label={ariaLabel}
      className="tw-mb-5 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800/80 tw-pb-4"
    >
      <div className="tw-flex tw-flex-col tw-gap-x-6 tw-gap-y-2 md:tw-flex-row md:tw-items-start">
        <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-1">
          <span className="tw-shrink-0 tw-whitespace-nowrap tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-500">
            {sortByLabel}
          </span>
          <fieldset className="tw-m-0 tw-flex tw-shrink-0 tw-items-center tw-border-0 tw-p-0">
            <legend className="tw-sr-only">{directionLegend}</legend>
            {printSortDirectionButton(
              SortDirection.ASC,
              faChevronCircleUp,
              ascendingLabel
            )}
            {printSortDirectionButton(
              SortDirection.DESC,
              faChevronCircleDown,
              descendingLabel
            )}
          </fieldset>
        </div>
        <div className="tw-flex tw-min-w-0 tw-flex-nowrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-overflow-x-auto tw-overflow-y-hidden tw-pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:tw-flex-wrap sm:tw-overflow-visible sm:tw-pb-0 [&::-webkit-scrollbar]:tw-hidden">
          {sortOptions.map((sortOption) => (
            <CollectionSortButton
              key={sortOption}
              currentSort={currentSort}
              sort={sortOption}
              select={() => setSort(sortOption)}
              ariaLabel={getSortButtonAriaLabel?.(sortOption)}
            >
              {getSortLabel?.(sortOption) ?? sortOption}
            </CollectionSortButton>
          ))}
          {children !== undefined && children !== null ? (
            <div className="tw-shrink-0">{children}</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
