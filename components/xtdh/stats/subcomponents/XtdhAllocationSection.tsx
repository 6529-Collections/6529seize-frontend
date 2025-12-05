import type { XtdhAllocationProps } from "../types";
import { XtdhProgressBar } from "./XtdhProgressBar";

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
        <XtdhProgressBar
          percentage={percentage}
          ariaValueText={ariaValueText}
          ariaLabel="xTDH Allocation"
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
