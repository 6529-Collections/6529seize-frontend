import { DROPDOWN_PANEL_SURFACE_CLASSES } from "@/components/utils/select/dropdown/dropdownTriggerStyles";
import type { AllowlistToolSelectMenuMultipleOption } from "./AllowlistToolSelectMenuMultiple";
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
      className={`${DROPDOWN_PANEL_SURFACE_CLASSES} tw-absolute tw-z-10 tw-mt-1 tw-max-h-60 tw-w-full tw-list-none tw-overflow-auto tw-py-2 tw-pl-1.5 tw-pr-1.5 tw-text-base tw-ring-inset focus:tw-outline-none sm:tw-text-sm`}
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
        <li className="tw-p-2 tw-text-iron-300">No options found</li>
      )}
    </ul>
  );
}
