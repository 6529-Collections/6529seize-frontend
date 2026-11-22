import {
  DROPDOWN_CHECKMARK_CLASSES,
  getDropdownOptionStateClasses,
} from "@/components/utils/select/dropdown/dropdownTriggerStyles";
export default function RepCategorySearchItem({
  category,
  selected,
  disabledCategories = [],
  onSelect,
}: {
  readonly category: string;
  readonly selected: string | null;
  readonly disabledCategories?: string[] | undefined;
  readonly onSelect: (newV: string) => void;
}) {
  const isSelected = selected === category;
  const isDisabled = disabledCategories.includes(category);
  const disabledClasses =
    "tw-bg-transparent tw-text-gray-500 tw-cursor-not-allowed";
  const nonDisabledClasses = getDropdownOptionStateClasses(isSelected);
  return (
    <li className="tw-h-full">
      <button
        type="button"
        disabled={isDisabled}
        className={`${
          isDisabled ? disabledClasses : nonDisabledClasses
        } tw-relative tw-flex tw-h-full tw-w-full tw-select-none tw-items-center tw-justify-between tw-rounded-lg tw-border-none tw-px-2 tw-py-2 tw-text-left tw-transition tw-duration-300 tw-ease-out focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400`}
        onClick={() => onSelect(category)}
      >
        <div className="tw-w-full tw-truncate">
          <span className="tw-text-sm tw-font-medium">{category}</span>
          {isSelected && (
            <svg
              className={`tw-ml-2 tw-h-5 tw-w-5 ${DROPDOWN_CHECKMARK_CLASSES} tw-transition tw-duration-300 tw-ease-out`}
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
