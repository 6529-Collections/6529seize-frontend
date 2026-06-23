import React from "react";
import type { TimeLeft } from "@/helpers/waves/time.utils";
import { TimeUnitDisplay } from "./TimeUnitDisplay";

interface CompactTimeCountdownProps {
  readonly timeLeft?: TimeLeft | null | undefined;
}

/**
 * Displays a compact inline countdown for upcoming decisions.
 */
export const CompactTimeCountdown: React.FC<CompactTimeCountdownProps> = ({
  timeLeft,
}) => {
  const days = timeLeft?.days ?? 0;
  const hours = timeLeft?.hours ?? 0;
  const minutes = timeLeft?.minutes ?? 0;
  const seconds = timeLeft?.seconds ?? 0;

  return (
    <div className="tw-hidden tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-text-iron-300 md:tw-inline-flex">
      <span className="tw-whitespace-nowrap tw-font-medium tw-text-iron-300">
        Next winner:
      </span>
      <div className="tw-flex tw-items-center tw-gap-x-1.5">
        {days > 0 && <TimeUnitDisplay value={days} label="days" />}
        <TimeUnitDisplay value={hours} label="hrs" />
        <TimeUnitDisplay value={minutes} label="min" />
        <TimeUnitDisplay value={seconds} label="sec" />
      </div>
    </div>
  );
};
