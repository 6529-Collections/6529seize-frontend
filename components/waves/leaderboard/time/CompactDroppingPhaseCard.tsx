import React from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { useWave } from "../../../../hooks/useWave";

interface CompactDroppingPhaseCardProps {
  readonly wave: ApiWave;
}

/**
 * Compact card component for dropping phase - used in multi-decision waves
 * Simplified as descriptive text with minimal styling
 */
export const CompactDroppingPhaseCard: React.FC<CompactDroppingPhaseCardProps> = ({
  wave
}) => {
  // Using the useWave hook with default options (timers enabled)
  // This component needs timers for real-time countdown display
  const waveData = useWave(wave);
  
  const {
    phase: droppingTimeState,
    timeLeft: droppingTimeLeft,
    startTime: participationPeriodMin,
    endTime: participationPeriodMax
  } = waveData.participation;

  return (
    <div className="tw-px-2 tw-py-1.5">
      {droppingTimeState !== "COMPLETED" ? (
        <div className="tw-flex tw-items-center tw-justify-between tw-flex-nowrap">
          <span className="tw-font-normal">
            <span className="tw-text-xs tw-text-iron-400">
              {droppingTimeState === "UPCOMING"
                ? "Dropping starts in"
                : "Dropping ends in"}
            </span>{" "}
            <span className="tw-text-xs tw-font-mono tw-text-iron-300 tw-tracking-tight tw-ml-1">
              {droppingTimeLeft.days > 0 && `${droppingTimeLeft.days}d `}
              {droppingTimeLeft.hours}h {droppingTimeLeft.minutes}m
            </span>
            <span className="tw-text-xs tw-text-iron-400 tw-px-1.5 tw-whitespace-nowrap tw-ml-2">
              {droppingTimeState === "UPCOMING"
                ? new Date(participationPeriodMin).toLocaleDateString(
                    undefined,
                    { month: "short", day: "numeric" }
                  )
                : new Date(participationPeriodMax).toLocaleDateString(
                    undefined,
                    { month: "short", day: "numeric" }
                  )}
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
            {new Date(participationPeriodMax).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  );
};
