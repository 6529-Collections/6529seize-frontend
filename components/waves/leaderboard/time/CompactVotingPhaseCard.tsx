import React from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWave } from "@/hooks/useWave";
import { useWaveTimers } from "@/hooks/useWaveTimers";
import { OpenEndedPhaseRow } from "./OpenEndedPhaseRow";

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

  // Open-ended voting (e.g. perpetual rank waves) has no end to count down to.
  const hasNoEnd = wave.voting?.period?.max == null;

  if (hasNoEnd && !isUpcoming) {
    return (
      <OpenEndedPhaseRow labelKey="waves.leaderboard.phase.votingOngoing" />
    );
  }

  return (
    <div className="tw-px-2">
      {!isCompleted ? (
        <div className="tw-flex tw-flex-col tw-justify-between tw-gap-y-1 sm:tw-flex-row sm:tw-flex-nowrap sm:tw-items-center">
          <span className="tw-text-xs tw-text-iron-400">
            {isUpcoming ? "Voting starts in" : "Voting ends in"}
          </span>{" "}
          <span>
            <span className="tw-ml-1 tw-font-mono tw-text-xs tw-tracking-tight tw-text-iron-300">
              {timeLeft.days > 0 && `${timeLeft.days}d `}
              {timeLeft.hours}h {timeLeft.minutes}m
            </span>
            <span className="tw-ml-2 tw-whitespace-nowrap tw-px-1.5 tw-text-xs tw-text-iron-400">
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

          <span className="tw-ml-2 tw-whitespace-nowrap tw-rounded-sm tw-bg-white/5 tw-px-1.5 tw-text-xs tw-text-iron-400">
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
