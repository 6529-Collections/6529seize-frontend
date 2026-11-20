import {
  DROPDOWN_CHECKMARK_CLASSES,
  getDropdownOptionStateClasses,
} from "@/components/utils/select/dropdown/dropdownTriggerStyles";
import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";

export default function EmmaListSearchItem({
  item,
  selectedId,
  onSelect,
}: {
  readonly item: AllowlistDescription;
  readonly selectedId: string | null;
  readonly onSelect: (item: AllowlistDescription) => void;
}) {
  const isSelected = selectedId === item.id;

  return (
    <li className="tw-h-full">
      <button
        type="button"
        onClick={() => onSelect(item)}
        className={`tw-relative tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-justify-between tw-rounded-lg tw-border-none tw-px-2 tw-py-2 tw-text-left tw-transition tw-duration-300 tw-ease-out focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 ${getDropdownOptionStateClasses(isSelected)}`}
      >
        <div className="tw-inline-flex tw-w-full tw-items-center tw-justify-between tw-truncate">
          <div className="tw-inline-flex tw-items-center tw-space-x-2">
            <div>
              <p className="tw-mb-0 tw-truncate tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-white">
                {item.name}
              </p>
              <p className="tw-mb-0 tw-truncate tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400">
                {item.description}
              </p>
            </div>
          </div>
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
