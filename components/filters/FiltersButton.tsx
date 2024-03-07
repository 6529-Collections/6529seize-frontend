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
        className="tw-bg-transparent tw-border-none"
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
