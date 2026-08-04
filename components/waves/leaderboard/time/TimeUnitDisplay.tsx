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
    <span className="tw-inline-flex tw-items-baseline tw-gap-px">
      <span className="tw-font-medium tw-text-iron-300">{value}</span>
      <span className="tw-font-normal tw-text-iron-500">{label}</span>
    </span>
  );
};
