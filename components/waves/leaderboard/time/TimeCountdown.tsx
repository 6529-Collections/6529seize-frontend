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
    <div className="tw-flex tw-gap-1.5">
      {/* Days - only show when > 0 */}
      {timeLeft.days > 0 && (
        <TimeUnitDisplay value={timeLeft.days} label="DAYS" />
      )}
      {/* Hours - always show */}
      <TimeUnitDisplay value={timeLeft.hours} label="HRS" />
      {/* Minutes - always show */}
      <TimeUnitDisplay value={timeLeft.minutes} label="MIN" />
      {/* Seconds - always show */}
      <TimeUnitDisplay value={timeLeft.seconds} label="SEC" />
    </div>
  );
};