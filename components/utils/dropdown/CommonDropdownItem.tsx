import { CommonDropdownItemType } from "./CommonDropdown";

export default function CommonDropdownItem<T>({
  item,
  activeItem,
  setActiveItem,
}: {
  readonly item: CommonDropdownItemType<T>;
  readonly activeItem: T;
  readonly setActiveItem: (item: T) => void;
}) {
  return (
    <li
      className="tw-h-full tw-flex tw-items-center tw-justify-between tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-p-2 hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out"
      onClick={() => setActiveItem(item.value)}
    >
      <div className="tw-w-44 tw-truncate">
        <span className="tw-text-sm tw-font-medium tw-text-white">
          {item.label}
        </span>
        {item.value === activeItem && (
          <svg
            className="tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
            viewBox="0 0 24 24"
            fill="none"
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
    </li>
  );
}
