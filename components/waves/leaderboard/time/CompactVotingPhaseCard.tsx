import React from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { useWave } from "../../../../hooks/useWave";
import { useWaveTimers } from "../../../../hooks/useWaveTimers";

interface CompactVotingPhaseCardProps {
  readonly wave: ApiWave;
}

/**
 * Compact card component for voting phase - used in multi-decision waves
 * Simplified as descriptive text with minimal styling
 */
export const CompactVotingPhaseCard: React.FC<CompactVotingPhaseCardProps> = ({
  wave,
}) => {
  // Using the useWave hook with default options (timers enabled)
  // This component needs timers for real-time countdown display
  const {
    voting: { startTime, endTime },
  } = useWave(wave);

  const {
    voting: { isUpcoming, isCompleted, timeLeft },
  } = useWaveTimers(wave);

  return (
    <div className="tw-px-2">
      {!isCompleted ? (
        <div className="tw-flex sm:tw-items-center tw-flex-col sm:tw-flex-row tw-justify-between sm:tw-flex-nowrap tw-gap-y-1">
          <span className="tw-text-xs tw-text-iron-400">
            {isUpcoming ? "Voting starts in" : "Voting ends in"}
          </span>{" "}
          <span>
            <span className="tw-text-xs tw-font-mono tw-text-iron-300 tw-tracking-tight tw-ml-1">
              {timeLeft.days > 0 && `${timeLeft.days}d `}
              {timeLeft.hours}h {timeLeft.minutes}m
            </span>
            <span className="tw-text-xs tw-text-iron-400 tw-px-1.5 tw-whitespace-nowrap tw-ml-2">
              {isUpcoming
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
        <div className="tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex-1">
            <span className="tw-font-normal">
              <span className="tw-text-xs tw-text-iron-400">
                Voting complete
              </span>
            </span>
          </div>

          <span className="tw-text-xs tw-text-iron-400 tw-bg-white/5 tw-rounded-sm tw-px-1.5 tw-whitespace-nowrap tw-ml-2">
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
