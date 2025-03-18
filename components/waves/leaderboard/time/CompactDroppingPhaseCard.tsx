import React from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { useWave } from "../../../../hooks/useWave";
import { useWaveTimers } from "../../../../hooks/useWaveTimers";
interface CompactDroppingPhaseCardProps {
  readonly wave: ApiWave;
}

/**
 * Compact card component for dropping phase - used in multi-decision waves
 * Simplified as descriptive text with minimal styling
 */
export const CompactDroppingPhaseCard: React.FC<
  CompactDroppingPhaseCardProps
> = ({ wave }) => {
  const {
    participation: { phase, timeLeft },
  } = useWaveTimers(wave);
  const {
    participation: { startTime, endTime },
  } = useWave(wave);

  return (
    <div className="tw-px-2">
      {phase !== "COMPLETED" ? (
        <div className="tw-flex tw-items-center tw-justify-between tw-flex-nowrap">
          <span className="tw-font-normal">
            <span className="tw-text-xs tw-text-iron-400">
              {phase === "UPCOMING" ? "Dropping starts in" : "Dropping ends in"}
            </span>{" "}
            <span className="tw-text-xs tw-font-mono tw-text-iron-300 tw-tracking-tight tw-ml-1">
              {timeLeft.days > 0 && `${timeLeft.days}d `}
              {timeLeft.hours}h {timeLeft.minutes}m
            </span>
            <span className="tw-text-xs tw-text-iron-400 tw-px-1.5 tw-whitespace-nowrap tw-ml-2">
              {phase === "UPCOMING"
                ? new Date(startTime).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : new Date(endTime).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
            </span>
          </span>
        </div>
      ) : (
        <div className="tw-flex tw-items-center tw-justify-between tw-flex-nowrap">
          <div className="tw-flex-1">
            <span className="tw-font-normal">
              <span className="tw-text-xs tw-text-iron-400">
                Dropping complete
              </span>
            </span>
          </div>

          <span className="tw-text-xs tw-text-iron-400 tw-px-1.5 tw-whitespace-nowrap tw-ml-2">
            {new Date(endTime).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  );
};
