import { useEffect, useState } from "react";
import { AllowlistToolSelectMenuOption } from "./AllowlistToolSelectMenu";

export default function AllowlistToolSelectMenuListItem({
  option,
  selectedOption,
  setSelectedOption,
}: {
  option: AllowlistToolSelectMenuOption;
  selectedOption: AllowlistToolSelectMenuOption | null;
  setSelectedOption: (option: AllowlistToolSelectMenuOption) => void;
}) {
  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    setIsSelected(selectedOption?.value === option.value);
  }, [selectedOption, option.value]);

  return (
    <li
      onClick={(e) => {
        e.stopPropagation();
        setSelectedOption(option);
      }}
      className="tw-group tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-py-2.5 tw-pl-3 tw-pr-9 hover:tw-bg-neutral-700 tw-transition tw-duration-300 tw-ease-out"
      role="option"
      aria-selected="true"
    >
      <div className="tw-w-full tw-flex tw-justify-between tw-items-center tw-gap-x-4 tw-pr-4">
        <div className="tw-flex-1">
          <span className="tw-font-normal tw-block tw-truncate">
            {option.title}
          </span>
        </div>

        <div className="tw-flex-1 tw-text-right">
          {option.subTitle && (
            <span className="tw-font-light tw-text-neutral-500 tw-text-xs tw-block tw-truncate group-hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out">
              {option.subTitle}
            </span>
          )}
        </div>
      </div>

      {isSelected && (
        <span className="tw-text-white tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-4">
          <svg
            className="tw-h-5 tw-w-5 tw-text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
    </li>
  );
}
