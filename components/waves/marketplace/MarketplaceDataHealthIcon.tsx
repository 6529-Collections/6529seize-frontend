import type {
  MarketplaceDataHealth,
  MarketplaceDataHealthState,
} from "./common";

interface MarketplaceDataHealthIconProps {
  readonly dataHealth: MarketplaceDataHealth;
}

const TEXT_COLOR_CLASS_BY_STATE: Record<MarketplaceDataHealthState, string> = {
  fresh: "tw-text-success",
  stale: "tw-text-amber-300",
  error: "tw-text-error",
  unknown: "tw-text-iron-400",
};

export default function MarketplaceDataHealthIcon({
  dataHealth,
}: MarketplaceDataHealthIconProps) {
  return (
    <span
      className={`tw-absolute tw-left-3 tw-top-3 tw-z-10 tw-inline-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/15 tw-bg-black/45 tw-backdrop-blur-md ${TEXT_COLOR_CLASS_BY_STATE[dataHealth.state]}`}
      role="img"
      aria-label={dataHealth.details}
      title={dataHealth.details}
      data-state={dataHealth.state}
      data-testid="marketplace-data-health-icon"
    >
      <svg
        className="tw-size-3.5"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 6V12L16 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
