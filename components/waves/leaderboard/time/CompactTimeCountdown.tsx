import React from "react";
import { TimeLeft } from "../../../../helpers/waves/time.utils";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TimeUnitDisplay } from "./TimeUnitDisplay";

interface CompactTimeCountdownProps {
  readonly timeLeft: TimeLeft;
  readonly label?: string;
  readonly className?: string;
}

/**
 * Displays a compact countdown with time units inline
 * Used in tab headers and other space-constrained areas
 */
export const CompactTimeCountdown: React.FC<CompactTimeCountdownProps> = ({
  timeLeft,
  className = "",
}) => {
  return (
    <div
      className={`tw-hidden md:tw-flex tw-items-center tw-gap-1.5 tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-rounded-lg tw-border tw-border-emerald-600/20 tw-flex-shrink-0 ${className}`}
    >
      <div className="tw-flex-shrink-0 tw-text-emerald-500">
        <FontAwesomeIcon icon={faClock} className="tw-size-3.5 -tw-mt-0.5" />
      </div>
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <span
          className={`tw-text-xs tw-text-emerald-500 tw-font-medium tw-hidden @[700px]:tw-flex`}
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
