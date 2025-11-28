import type { XtdhAllocationProps } from "../types";

export function XtdhAllocationSection({
  total,
  granted,
  available,
  percentage,
  ariaValueText,
}: Readonly<XtdhAllocationProps>) {
  return (
    <section
      aria-labelledby="xtdh-allocation-section"
      className="tw-mt-5"
    >
      <p
        id="xtdh-allocation-section"
        className="tw-mb-2 tw-text-xs tw-font-medium tw-uppercase tw-text-iron-300"
        title="Overview of how much of your daily xTDH rate is currently granted"
      >
        xTDH Allocation
      </p>
      <div className="tw-space-y-2">
        <progress
          className="tw-block tw-h-2.5 tw-w-full tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-900 tw-text-primary-500 tw-transition-all tw-duration-300 tw-appearance-none [&::-webkit-progress-bar]:tw-rounded-full [&::-webkit-progress-bar]:tw-bg-transparent [&::-webkit-progress-value]:tw-rounded-full [&::-webkit-progress-value]:tw-bg-primary-500 [&::-moz-progress-bar]:tw-rounded-full [&::-moz-progress-bar]:tw-bg-primary-500"
          value={percentage}
          max={100}
          aria-valuenow={percentage}
          aria-valuetext={ariaValueText}
          aria-labelledby="xtdh-allocation-section"
        />
        <p className="tw-text-sm tw-text-iron-200">
          <span className="tw-font-semibold">{granted}</span>
          {` / ${total} granted`}
          <span className="tw-text-iron-400"> • </span>
          <span className="tw-font-semibold">{available}</span>
          {" available"}
        </p>
      </div>
    </section>
  );
}
