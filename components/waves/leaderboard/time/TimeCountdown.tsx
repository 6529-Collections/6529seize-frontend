import React from "react";
import { TimeLeft } from "../../../../helpers/waves/time.utils";
import { TimeUnitDisplay } from "./TimeUnitDisplay";

interface TimeCountdownProps {
  readonly timeLeft: TimeLeft;
}

/**
 * Displays a countdown with time units
 */
export const TimeCountdown: React.FC<TimeCountdownProps> = ({
  timeLeft
}) => {
  return (
    <div className="tw-flex tw-w-full sm:tw-w-auto tw-gap-2">
      {/* Days - only show when > 0 */}
      {timeLeft.days > 0 && (
        <div className="tw-flex-1 sm:tw-flex-none"> <TimeUnitDisplay value={timeLeft.days} label="days" /></div>
      )}
      {/* Hours - always show */}
      <div className="tw-flex-1 sm:tw-flex-none"> <TimeUnitDisplay value={timeLeft.hours} label="hrs" /></div>
      {/* Minutes - always show */}
      <div className="tw-flex-1 sm:tw-flex-none"> <TimeUnitDisplay value={timeLeft.minutes} label="min" /></div>
      {/* Seconds - always show */}
      <div className="tw-flex-1 sm:tw-flex-none"> <TimeUnitDisplay value={timeLeft.seconds} label="sec" /></div>
    </div>
  );
};