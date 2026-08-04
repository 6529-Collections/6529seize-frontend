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
    <span className="tw-inline-flex tw-items-baseline tw-font-medium tw-text-iron-300">
      <span>{value}</span>
      <span>{label}</span>
    </span>
  );
};
