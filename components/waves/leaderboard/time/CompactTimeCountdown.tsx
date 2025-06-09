import React from "react";
import { TimeLeft } from "../../../../helpers/waves/time.utils";
import { TimeUnitDisplay } from "./TimeUnitDisplay";

interface CompactTimeCountdownProps {
  readonly timeLeft: TimeLeft;
  readonly label?: string;
  readonly className?: string;
  readonly isPaused?: boolean;
}

/**
 * Displays a compact countdown with time units inline
 * Used in tab headers and other space-constrained areas
 */
export const CompactTimeCountdown: React.FC<CompactTimeCountdownProps> = ({
  timeLeft,
  className = "",
  isPaused = false,
}) => {
  return (
    <div
      className={`tw-hidden md:tw-flex tw-items-center tw-gap-1.5 tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-rounded-lg tw-border ${
        isPaused ? "tw-border-yellow-600/20" : "tw-border-emerald-600/20"
      } tw-flex-shrink-0 ${className}`}
    >
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <span
          className={`tw-text-xs tw-text-primary-400 tw-font-semibold`}
        >
          Next winner:
        </span>
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          {/* Days - only show when > 0 */}
          {timeLeft.days > 0 && (
            <TimeUnitDisplay value={timeLeft.days} label="days" />
          )}

          {/* Hours */}
          <TimeUnitDisplay value={timeLeft.hours} label="hrs" />

          {/* Minutes */}
          <TimeUnitDisplay value={timeLeft.minutes} label="min" />

          {/* Seconds */}
          <TimeUnitDisplay value={timeLeft.seconds} label="sec" />
        </div>
      </div>
    </div>
  );
};
