import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";
import type { XtdhCollectionsSortField } from "@/hooks/useXtdhCollectionsQuery";
import { SortDirection } from "@/entities/ISort";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

import { COLLECTION_SORT_ITEMS } from "../constants";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface XtdhCollectionsControlsProps {
  readonly activeSortField: XtdhCollectionsSortField;
  readonly activeSortDirection: SortDirection;
  readonly onSortChange: (sort: XtdhCollectionsSortField) => void;
  readonly searchTerm: string;
  readonly onSearchChange: (term: string) => void;

  readonly isDisabled?: boolean | undefined;
}

export function XtdhCollectionsControls({
  activeSortField,
  activeSortDirection,
  onSortChange,
  searchTerm,
  onSearchChange,

  isDisabled = false,
}: Readonly<XtdhCollectionsControlsProps>) {
  const locale = useBrowserLocale();
  const searchLabel = t(locale, "xtdh.collections.search.label");
  const sortLabel = t(locale, "xtdh.collections.sort.label");
  const activeDirectionLabel = t(
    locale,
    activeSortDirection === SortDirection.ASC
      ? "xtdh.collections.sort.ascending"
      : "xtdh.collections.sort.descending"
  );

  return (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.05] tw-p-4 md:tw-flex-row md:tw-items-center md:tw-justify-between md:tw-p-5">
      <div className="tw-relative tw-w-full md:tw-max-w-sm">
        <label htmlFor="xtdh-collections-search" className="tw-sr-only">
          {searchLabel}
        </label>
        <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-flex tw-items-center tw-pl-3">
          <MagnifyingGlassIcon
            className="tw-h-5 tw-w-5 tw-text-iron-400"
            aria-hidden="true"
          />
        </div>
        <input
          id="xtdh-collections-search"
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={isDisabled}
          placeholder={t(locale, "xtdh.collections.search.placeholder")}
          className="tw-form-input tw-block tw-h-11 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-2.5 tw-pl-10 tw-pr-3 tw-text-iron-100 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-white/[0.05] tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-ring-white/10 sm:tw-text-sm sm:tw-leading-6"
        />
      </div>
      <fieldset className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0 md:tw-flex-none">
        <legend className="tw-sr-only">{sortLabel}</legend>
        <div className="tw-grid tw-min-h-11 tw-grid-cols-2 tw-rounded-lg tw-bg-iron-900 tw-p-1 tw-ring-1 tw-ring-inset tw-ring-white/[0.05]">
          {COLLECTION_SORT_ITEMS.map((item) => {
            const isActive = item.value === activeSortField;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={isActive}
                disabled={isDisabled}
                onClick={() => onSortChange(item.value)}
                className={`tw-group tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 ${
                  isActive
                    ? "tw-bg-iron-800 tw-text-iron-100"
                    : "tw-bg-transparent tw-text-iron-500 desktop-hover:hover:tw-bg-iron-800/60 desktop-hover:hover:tw-text-iron-100"
                }`}
              >
                <span>{item.label}</span>
                {isActive ? (
                  <>
                    <CommonTableSortIcon
                      direction={activeSortDirection}
                      isActive={true}
                    />
                    <span className="tw-sr-only">
                      {`, ${activeDirectionLabel}`}
                    </span>
                  </>
                ) : null}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
