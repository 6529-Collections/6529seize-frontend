import { AllowlistToolSelectMenuOption } from "./AllowlistToolSelectMenu";
import AllowlistToolSelectMenuListItem from "./AllowlistToolSelectMenuListItem";

export default function AllowlistToolSelectMenuList({
  options,
  selectedOption,
  setSelectedOption,
}: {
  options: AllowlistToolSelectMenuOption[];
  selectedOption: AllowlistToolSelectMenuOption | null;
  setSelectedOption: (option: AllowlistToolSelectMenuOption) => void;
}) {
  return (
    <ul
      className="tw-absolute tw-z-10 tw-pl-1.5 tw-pr-1.5 tw-list-none tw-mt-1 tw-max-h-60 tw-w-full tw-overflow-auto tw-rounded-md tw-bg-neutral-800 tw-py-2 tw-text-base tw-shadow-lg tw-ring-1 tw-ring-black tw-ring-opacity-5 focus:tw-outline-none sm:tw-text-sm"
      role="listbox"
      aria-labelledby="listbox-label"
      aria-activedescendant="listbox-option-3"
    >
      {!!options.length &&
        options.map((option) => (
          <AllowlistToolSelectMenuListItem
            option={option}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            key={option.value}
          />
        ))}
      {options.length === 0 && (
        <li className="tw-p-2 tw-text-center tw-text-neutral-300">
          No options found
        </li>
      )}
    </ul>
  );
}
