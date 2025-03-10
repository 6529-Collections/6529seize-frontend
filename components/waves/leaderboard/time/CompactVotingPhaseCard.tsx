import React from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { useWave } from "../../../../hooks/useWave";

interface CompactVotingPhaseCardProps {
  readonly wave: ApiWave;
}

/**
 * Compact card component for voting phase - used in multi-decision waves
 * Simplified as descriptive text with minimal styling
 */
export const CompactVotingPhaseCard: React.FC<CompactVotingPhaseCardProps> = ({
  wave
}) => {
  // Using the useWave hook with default options (timers enabled)
  // This component needs timers for real-time countdown display
  const waveData = useWave(wave);
  
  const {
    phase: votingTimeState,
    timeLeft: votingTimeLeft,
    startTime: votingPeriodMin,
    endTime: votingPeriodMax
  } = waveData.voting.time;

  return (
    <div className="tw-px-2">
      {votingTimeState !== "COMPLETED" ? (
        <div className="tw-flex tw-items-center tw-justify-between tw-flex-nowrap">
          <span className="tw-font-normal">
            <span className="tw-text-xs tw-text-iron-400">
              {votingTimeState === "UPCOMING"
                ? "Voting starts in"
                : "Voting ends in"}
            </span>{" "}
            <span className="tw-text-xs tw-font-mono tw-text-iron-300 tw-tracking-tight tw-ml-1">
              {votingTimeLeft.days > 0 && `${votingTimeLeft.days}d `}
              {votingTimeLeft.hours}h {votingTimeLeft.minutes}m
            </span>
            <span className="tw-text-xs tw-text-iron-400 tw-px-1.5 tw-whitespace-nowrap tw-ml-2">
              {votingTimeState === "UPCOMING"
                ? new Date(votingPeriodMin).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : new Date(votingPeriodMax).toLocaleDateString(undefined, {
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
            {new Date(votingPeriodMax).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  );
};
