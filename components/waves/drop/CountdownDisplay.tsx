import React from "react";
import { TimeLeft } from "@/helpers/waves/time.utils";

// Using the existing TimeLeft type from time.utils.ts
type TimeRemaining = TimeLeft;

interface CountdownDisplayProps {
  headerText: string;
  headerClassName?: string;
  timeRemaining: TimeRemaining;
  hourLabel?: string;
  minuteLabel?: string;
  secondLabel?: string;
  secondsClassName?: string;
}

/**
 * Reusable countdown component to display time remaining with customizable labels
 */
export const CountdownDisplay: React.FC<CountdownDisplayProps> = ({
  headerText,
  headerClassName = "tw-text-xs tw-text-iron-400",
  timeRemaining,
  hourLabel = "Hrs",
  minuteLabel = "Min",
  secondLabel = "Sec",
  secondsClassName = "tw-text-xl tw-font-semibold tw-text-iron-100"
}) => {
  return (
    <>
      <span className={headerClassName}>{headerText}</span>
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-2 tw-mt-1">
        <div className="tw-flex tw-items-center tw-gap-x-4">
          <div className="tw-flex tw-items-baseline">
            <span className="tw-text-xl tw-font-semibold tw-text-iron-100">
              {timeRemaining.days}
            </span>
            <span className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500 tw-font-medium tw-ml-1">
              {timeRemaining.days === 1 ? "Day" : "Days"}
            </span>
          </div>
          <div className="tw-flex tw-items-baseline">
            <span className="tw-text-xl tw-font-semibold tw-text-iron-100">
              {timeRemaining.hours}
            </span>
            <span className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500 tw-font-medium tw-ml-1">
              {hourLabel}
            </span>
          </div>
          <div className="tw-flex tw-items-baseline">
            <span className="tw-text-xl tw-font-semibold tw-text-iron-100">
              {timeRemaining.minutes}
            </span>
            <span className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500 tw-font-medium tw-ml-1">
              {minuteLabel}
            </span>
          </div>
          <div className="tw-flex tw-items-baseline">
            <span className={secondsClassName}>
              {timeRemaining.seconds}
            </span>
            <span className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500 tw-font-medium tw-ml-1">
              {secondLabel}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};