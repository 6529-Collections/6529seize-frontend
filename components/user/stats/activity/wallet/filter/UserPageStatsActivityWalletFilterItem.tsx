import type { UserPageStatsActivityWalletFilterType } from "../UserPageStatsActivityWallet.types";

export default function UserPageStatsActivityWalletFilterItem({
  filter,
  title,
  ariaLabel,
  activeFilter,
  onFilter,
}: {
  readonly filter: UserPageStatsActivityWalletFilterType;
  readonly title: string;
  readonly ariaLabel: string;
  readonly activeFilter: UserPageStatsActivityWalletFilterType;
  readonly onFilter: (filter: UserPageStatsActivityWalletFilterType) => void;
}) {
  const isActive = filter === activeFilter;
  return (
    <li>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-pressed={isActive}
        className="tw-relative tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-justify-between tw-rounded-lg tw-border-none tw-bg-transparent tw-p-2 tw-text-left tw-text-white tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-700"
        onClick={() => onFilter(filter)}
      >
        <div className="tw-w-44 tw-truncate">
          <span className="tw-text-sm tw-font-medium tw-text-white">
            {title}
          </span>
          {isActive && (
            <svg
              aria-hidden="true"
              className="tw-ml-2 tw-h-5 tw-w-5 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
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
      </button>
    </li>
  );
}
