import { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";

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
        className="hover:tw-bg-iron-700 tw-py-2 tw-w-full tw-h-full tw-bg-transparent tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
      >
        <div className="tw-w-full tw-truncate tw-inline-flex tw-justify-between tw-items-center">
          <div className="tw-inline-flex tw-space-x-2 tw-items-center">
            <div>
              <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-white tw-truncate tw-whitespace-nowrap">
                {item.name}
              </p>
              <p className="tw-mb-0 tw-text-xs tw-font-medium tw-text-iron-400 tw-truncate tw-whitespace-nowrap">
                {item.description}
              </p>
            </div>
          </div>
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
