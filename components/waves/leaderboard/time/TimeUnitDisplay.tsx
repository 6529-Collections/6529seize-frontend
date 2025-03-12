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
  label 
}) => {
  return (
    <div className="tw-bg-primary-300/5 tw-border tw-border-primary-300/10 tw-rounded tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium">
      <span className="tw-text-iron-100">
        {value}
      </span>
      <span className="tw-uppercase tw-text-iron-400 tw-ml-1 tw-text-[10px]">
        {label}
      </span>
    </div>
  );
};