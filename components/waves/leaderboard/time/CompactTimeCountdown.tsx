import React from "react";
import { TimeLeft } from "@/helpers/waves/time.utils";
import { TimeUnitDisplay } from "./TimeUnitDisplay";

interface CompactTimeCountdownProps {
  readonly timeLeft: TimeLeft;
  readonly label?: string;
}

/**
 * Displays a compact countdown with time units inline
 * Used in tab headers and other space-constrained areas
 */
export const CompactTimeCountdown: React.FC<CompactTimeCountdownProps> = ({
  timeLeft,
}) => {
  return (
    <div className="tw-hidden md:tw-inline-flex tw-items-center tw-gap-1.5 tw-text-xxs tw-font-medium tw-text-iron-300">
      <span className="tw-text-iron-300 tw-font-medium tw-whitespace-nowrap">
        Next winner:
      </span>
      <div className="tw-flex tw-items-center tw-gap-x-1.5">
        {/* Days - only show when > 0 */}
        {timeLeft.days > 0 && (
          <TimeUnitDisplay value={timeLeft.days} label="days" />
        )}
        <TimeUnitDisplay value={timeLeft.hours} label="hrs" />
        <TimeUnitDisplay value={timeLeft.minutes} label="min" />
        <TimeUnitDisplay value={timeLeft.seconds} label="sec" />
      </div>
    </div>
  );
};
