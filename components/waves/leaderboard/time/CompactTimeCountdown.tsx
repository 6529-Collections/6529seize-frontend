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
    <div className="tw-hidden md:tw-flex tw-px-4 tw-py-2 tw-bg-iron-800/95 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700/50 tw-items-center tw-justify-between tw-cursor-pointer desktop-hover:hover:tw-bg-iron-700/95 tw-transition-all tw-duration-300 tw-ease-in-out tw-group tw-shadow-sm">
      <div className="tw-flex tw-items-baseline tw-gap-x-2">
        <span className={`tw-text-xs tw-text-iron-100 tw-font-semibold tw-whitespace-nowrap`}>
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
    </div>
  );
};
