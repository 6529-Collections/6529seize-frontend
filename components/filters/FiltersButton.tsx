import { useState } from "react";
import CommonAnimationWrapper from "../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../utils/animation/CommonAnimationOpacity";
import FilterBuilder, { GeneralFilter } from "./FilterBuilder";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import FilterModal from "./FilterModal";

export default function FiltersButton({
  profile,
  filters,
  onFilters,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly filters: GeneralFilter;
  readonly onFilters: (filters: GeneralFilter) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div>
      <svg
        onClick={() => setIsOpen(!isOpen)}
        className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 12H18M3 6H21M9 18H15"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <FilterModal
              profile={profile}
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
