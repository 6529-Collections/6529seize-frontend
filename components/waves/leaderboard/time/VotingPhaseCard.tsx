import React from "react";
import { TimeLeft } from "../../../../helpers/waves/time.utils";
import { WaveLeaderboardTimeState } from "../../../../helpers/waves/time.types";
import { TimePhaseIcon } from "./TimePhaseIcon";
import { TimePhaseStatus, TimePhaseTitle } from "./TimePhaseStatus";
import { TimeCountdownDisplay } from "./TimeCountdownDisplay";

interface VotingPhaseCardProps {
  readonly votingTimeState: WaveLeaderboardTimeState;
  readonly votingTimeLeft: TimeLeft;
  readonly votingPeriodMin: number;
  readonly votingPeriodMax: number;
}

/**
 * Card component for voting phase
 */
export const VotingPhaseCard: React.FC<VotingPhaseCardProps> = ({
  votingTimeState,
  votingTimeLeft,
  votingPeriodMin,
  votingPeriodMax,
}) => {
  return (
    <div className="tw-rounded-lg tw-bg-gradient-to-br tw-from-[#1E1E2E]/80 tw-via-[#2E2E3E]/60 tw-to-[#3E2E3E]/40 tw-px-4 tw-py-3 tw-backdrop-blur-sm tw-border tw-border-[#3E2E3E]/20">
      <div className="tw-flex tw-items-center tw-gap-x-3 tw-gap-y-2 tw-mb-3.5">
        <TimePhaseIcon 
          phaseState={votingTimeState} 
          color="violet" 
        />

        <div className="tw-flex tw-justify-between tw-items-center tw-w-full">
          <TimePhaseTitle 
            phaseState={votingTimeState} 
            phaseType="Voting" 
          />
          <p className="tw-text-xs tw-text-white/60 tw-mb-0">
            {votingTimeState === WaveLeaderboardTimeState.UPCOMING &&
              new Date(votingPeriodMin).toLocaleDateString()}
            {votingTimeState === WaveLeaderboardTimeState.IN_PROGRESS &&
              new Date(votingPeriodMax).toLocaleDateString()}
            {votingTimeState === WaveLeaderboardTimeState.COMPLETED &&
              new Date(votingPeriodMax).toLocaleDateString()}
          </p>
        </div>
      </div>

      {votingTimeState !== WaveLeaderboardTimeState.COMPLETED ? (
        <TimeCountdownDisplay timeLeft={votingTimeLeft} />
      ) : (
        <TimePhaseStatus 
          phaseState={votingTimeState} 
          phaseType="Voting" 
        />
      )}
    </div>
  );
};
