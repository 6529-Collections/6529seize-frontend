import { CurationFilterResponse } from "../../../helpers/filters/Filters.types";

export default function CommunityCurationFiltersSearchFilterDropdownItem({
  filter,
  selected,
  onSelect,
}: {
  readonly filter: CurationFilterResponse;
  readonly selected: string | null;
  readonly onSelect: (newV: string) => void;
}) {
  const isSelected = selected === filter.name;

  return (
    <li className="tw-h-full">
      <button
        type="button"
        className="hover:tw-bg-iron-700 tw-py-2 tw-w-full tw-h-full tw-bg-transparent tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
        onClick={() => onSelect(filter.name)}
      >
        <div className="tw-w-44 tw-truncate">
          <span className="tw-text-sm tw-font-medium tw-text-white">
            {filter.name}
          </span>
          {isSelected && (
            <svg
              className="tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </button>
    </li>
  );
}
