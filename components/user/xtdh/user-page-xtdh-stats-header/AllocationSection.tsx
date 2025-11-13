import type { AllocationSectionProps } from "./types";

export function AllocationSection({
  allocation,
}: Readonly<AllocationSectionProps>) {
  const {
    grantedDisplay,
    totalDisplay,
    availableDisplay,
    percentage,
    ariaValueText,
  } = allocation;

  return (
    <div
      role="group"
      aria-label="xTDH Allocation"
      className="tw-mt-5"
    >
      <p
        className="tw-mb-2 tw-text-xs tw-font-medium tw-uppercase tw-text-iron-300"
        title="Overview of how much of your daily xTDH rate is currently granted"
        tabIndex={0}
      >
        xTDH Allocation
      </p>
      <div className="tw-space-y-2">
        <div className="tw-h-2.5 tw-w-full tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-900">
          <div
            className="tw-h-full tw-rounded-full tw-bg-primary-500 tw-transition-all tw-duration-300"
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.floor(percentage)}
            aria-valuetext={ariaValueText}
          />
        </div>
        <p className="tw-text-sm tw-text-iron-200">
          <span className="tw-font-semibold">{grantedDisplay}</span>
          {` / ${totalDisplay} granted`}
          <span className="tw-text-iron-400"> • </span>
          <span className="tw-font-semibold">{availableDisplay}</span>
          {" available"}
        </p>
      </div>
    </div>
  );
}

