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
  const disabledClasses = "tw-text-gray-500 tw-cursor-not-allowed";
  const nonDisabledClasses = "hover:tw-bg-iron-700 tw-text-white";
  return (
    <li className="tw-h-full">
      <button
        type="button"
        disabled={isDisabled}
        className={`${
          isDisabled ? disabledClasses : nonDisabledClasses
        } tw-py-2 tw-w-full tw-h-full tw-bg-transparent tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between  tw-rounded-lg tw-relative tw-select-none tw-px-2  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out`}
        onClick={() => onSelect(category)}
      >
        <div className="tw-w-full tw-truncate">
          <span className="tw-text-sm tw-font-medium ">{category}</span>
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
