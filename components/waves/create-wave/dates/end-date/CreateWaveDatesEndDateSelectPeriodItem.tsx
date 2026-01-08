import { PERIOD_LABELS } from "@/helpers/Helpers";
import type { Period } from "@/helpers/Types";

export default function CreateWaveDatesEndDateSelectPeriodItem({
  period,
  activePeriod,
  onPeriodSelect,
}: {
  readonly period: Period;
  readonly activePeriod: Period | null;
  readonly onPeriodSelect: (period: Period) => void;
}) {
  const isActive = activePeriod === period;
  const buttonClasses = isActive ? "" : "tw-bg-transparent";
  const labelClasses = isActive
    ? "tw-font-semibold tw-text-primary-400"
    : "tw-font-medium tw-text-white";
  return (
    <li className="tw-h-full" onClick={() => onPeriodSelect(period)}>
      <div
        className={`${buttonClasses} hover:tw-bg-iron-700 tw-py-3 tw-w-full  tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out`}
      >
        <span className={`${labelClasses} tw-text-base`}>
          {PERIOD_LABELS[period]}
        </span>
        {isActive && (
          <svg
            className="tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out"
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
            ></path>
          </svg>
        )}
      </div>
    </li>
  );
}
