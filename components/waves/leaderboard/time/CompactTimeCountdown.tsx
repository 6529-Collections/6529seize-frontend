import React from "react";
import type { TimeLeft } from "@/helpers/waves/time.utils";
import { TimeUnitDisplay } from "./TimeUnitDisplay";

interface CompactTimeCountdownProps {
  readonly timeLeft: TimeLeft;
}

/**
 * Displays a compact inline countdown for upcoming decisions.
 */
export const CompactTimeCountdown: React.FC<CompactTimeCountdownProps> = ({
  timeLeft,
}) => {
  return (
    <div className="tw-hidden tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-text-iron-300 md:tw-inline-flex">
      <span className="tw-whitespace-nowrap tw-font-medium tw-text-iron-300">
        Next winner:
      </span>
      <div className="tw-flex tw-items-center tw-gap-x-1.5">
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
