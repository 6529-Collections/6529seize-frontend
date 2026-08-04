import React from "react";
import type { TimeLeft } from "@/helpers/waves/time.utils";
import { TimeUnitDisplay } from "./TimeUnitDisplay";

interface CompactTimeCountdownProps {
  readonly timeLeft?: TimeLeft | null | undefined;
}

const formatAccessibleUnit = (value: number, unit: string): string =>
  `${value} ${unit}${value === 1 ? "" : "s"}`;

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
  const accessibleCountdown = [
    days > 0 ? formatAccessibleUnit(days, "day") : null,
    formatAccessibleUnit(hours, "hour"),
    formatAccessibleUnit(minutes, "minute"),
    formatAccessibleUnit(seconds, "second"),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className="tw-hidden tw-flex-shrink-0 tw-items-baseline tw-gap-1.5 tw-text-[11px] tw-leading-none @[24rem]/timeline:tw-inline-flex"
      aria-label={`Next winner in ${accessibleCountdown}`}
    >
      <span
        className="tw-whitespace-nowrap tw-font-medium tw-text-iron-500"
        aria-hidden="true"
      >
        Next winner
      </span>
      <div
        className="tw-flex tw-items-baseline tw-gap-x-1 tw-font-medium tw-text-iron-300"
        aria-hidden="true"
      >
        {days > 0 && <TimeUnitDisplay value={days} label="d" />}
        <TimeUnitDisplay value={hours} label="h" />
        <TimeUnitDisplay value={minutes} label="m" />
        <span className="tw-hidden @[28rem]/timeline:tw-inline-flex">
          <TimeUnitDisplay value={seconds} label="s" />
        </span>
      </div>
    </div>
  );
};
