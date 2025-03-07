import React from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { useWave } from "../../../../hooks/useWave";
import { TimePhaseIcon } from "./TimePhaseIcon";
import { TimePhaseStatus, TimePhaseTitle } from "./TimePhaseStatus";
import { TimeCountdownDisplay } from "./TimeCountdownDisplay";

interface VotingPhaseCardProps {
  readonly wave: ApiWave;
}

/**
 * Card component for voting phase
 */
export const VotingPhaseCard: React.FC<VotingPhaseCardProps> = ({
  wave,
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
            {votingTimeState === "UPCOMING" &&
              new Date(votingPeriodMin).toLocaleDateString()}
            {votingTimeState === "IN_PROGRESS" &&
              new Date(votingPeriodMax).toLocaleDateString()}
            {votingTimeState === "COMPLETED" &&
              new Date(votingPeriodMax).toLocaleDateString()}
          </p>
        </div>
      </div>

      {votingTimeState !== "COMPLETED" ? (
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
