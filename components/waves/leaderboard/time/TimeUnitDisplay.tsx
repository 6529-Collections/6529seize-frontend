import React from "react";

interface TimeUnitDisplayProps {
  readonly value: number;
  readonly label: string;
}

/**
 * Displays a single time unit box for the countdown
 */
export const TimeUnitDisplay: React.FC<TimeUnitDisplayProps> = ({
  value,
  label,
}) => {
  return (
    <div className="tw-flex tw-items-center tw-gap-x-0.5">
      <span className="tw-text-xs tw-font-medium tw-tabular-nums tw-text-iron-300">
        {value}
      </span>
      <span className="tw-text-xs tw-font-normal tw-text-iron-400">
        {label}
      </span>
    </div>
  );
};
