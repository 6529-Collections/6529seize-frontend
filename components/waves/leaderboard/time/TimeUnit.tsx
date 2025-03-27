import React from "react";

interface TimeUnitProps {
  readonly value: number;
  readonly label: string;
  readonly shortLabel?: string;
  readonly usePlural?: boolean;
}

/**
 * Displays a single time unit (days, hours, minutes, seconds) in a consistent style
 */
export const TimeUnit: React.FC<TimeUnitProps> = ({
  value,
  label,
  shortLabel,
  usePlural = true,
}) => {
  const displayLabel = usePlural && value !== 1 ? label : label.replace(/s$/, "");
  
  return (
    <div className="tw-mx-0.5 tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-solid tw-border-primary-300/10 tw-whitespace-nowrap">
      <span className="tw-text-sm sm:tw-text-base tw-font-semibold tw-text-white/90">
        {value}
      </span>
      <span className="tw-text-[10px] sm:tw-text-xs tw-uppercase tw-text-white/40 tw-ml-1">
        {shortLabel || displayLabel}
      </span>
    </div>
  );
};