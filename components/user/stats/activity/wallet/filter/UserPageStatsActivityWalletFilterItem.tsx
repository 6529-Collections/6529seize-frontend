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
        className={`tw-relative tw-flex tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-justify-between tw-gap-3 tw-rounded-md tw-border-none tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-font-medium tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 ${
          isActive
            ? "tw-bg-white/[0.04] tw-text-iron-200"
            : "tw-bg-transparent tw-text-iron-400 hover:tw-bg-white/[0.05] hover:tw-text-iron-200"
        }`}
        onClick={() => onFilter(filter)}
      >
        <span className="tw-min-w-0 tw-truncate">{title}</span>
        {isActive && (
          <svg
            aria-hidden="true"
            className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-primary-400"
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
      </button>
    </li>
  );
}
