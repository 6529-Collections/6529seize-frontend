import CommonAnimationWrapper from "../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../utils/animation/CommonAnimationOpacity";
import { GeneralFilter } from "./FilterBuilder";

import FilterModal from "./FilterModal";

export default function FiltersButton({
  filters,
  isOpen,
  onFilters,
  setIsOpen,
}: {
  readonly filters: GeneralFilter;
  readonly isOpen: boolean;
  readonly onFilters: (filters: GeneralFilter) => void;
  readonly setIsOpen: (isOpen: boolean) => void;
}) {
  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Filters"
        className="tw-h-10 tw-w-10 tw-relative tw-text-sm tw-font-semibold tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-text-iron-200 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
      >
        <svg
          className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 12H18M3 6H21M9 18H15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <FilterModal
              filters={filters}
              onClose={() => setIsOpen(false)}
              onFilters={onFilters}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
}
