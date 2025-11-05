
import { AllowlistToolSelectMenuMultipleOption } from "./AllowlistToolSelectMenuMultiple";
import AllowlistToolSelectMenuMultipleListItem from "./AllowlistToolSelectMenuMultipleListItem";

export default function AllowlistToolSelectMenuList({
  options,
  selectedOptions,
  toggleSelectedOption,
}: {
  options: AllowlistToolSelectMenuMultipleOption[];
  selectedOptions: AllowlistToolSelectMenuMultipleOption[];
  toggleSelectedOption: (option: AllowlistToolSelectMenuMultipleOption) => void;
}) {
  return (
    <ul
      className="tw-absolute tw-z-10 tw-pl-1.5 tw-pr-1.5 tw-list-none tw-mt-1 tw-max-h-60 tw-w-full tw-overflow-auto tw-rounded-lg tw-bg-[#282828] tw-py-2 tw-text-base tw-shadow-xl  tw-ring-1 tw-ring-inset tw-ring-white/10 focus:tw-outline-none sm:tw-text-sm"
      role="listbox"
      aria-labelledby="listbox-label"
      aria-activedescendant="listbox-option-3"
    >
      {!!options.length &&
        options.map((option) => (
          <AllowlistToolSelectMenuMultipleListItem
            option={option}
            selectedOptions={selectedOptions}
            toggleSelectedOption={toggleSelectedOption}
            key={option.value}
          />
        ))}
      {options.length === 0 && (
        <li className="tw-p-2 tw-text-iron-300">
          No options found
        </li>
      )}
    </ul>
  );
}


