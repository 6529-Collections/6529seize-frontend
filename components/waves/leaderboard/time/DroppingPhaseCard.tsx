import React from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { useWave } from "../../../../hooks/useWave";
import { TimePhaseIcon } from "./TimePhaseIcon";
import { TimePhaseStatus, TimePhaseTitle } from "./TimePhaseStatus";
import { TimeCountdownDisplay } from "./TimeCountdownDisplay";

interface DroppingPhaseCardProps {
  readonly wave: ApiWave;
}

/**
 * Card component for dropping phase
 */
export const DroppingPhaseCard: React.FC<DroppingPhaseCardProps> = ({
  wave,
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
    <div className="tw-rounded-lg tw-bg-gradient-to-br tw-from-[#1E1E2E]/80 tw-via-[#2E2E3E]/60 tw-to-[#3E2E3E]/40 tw-px-4 tw-py-3 tw-backdrop-blur-sm tw-border tw-border-[#3E2E3E]/20">
      <div className="tw-flex tw-items-center tw-gap-x-3 tw-gap-y-2 tw-mb-3.5">
        <TimePhaseIcon 
          phaseState={droppingTimeState} 
          color="emerald" 
        />

        <div className="tw-flex tw-justify-between tw-items-center tw-w-full">
          <TimePhaseTitle 
            phaseState={droppingTimeState} 
            phaseType="Dropping" 
          />
          <p className="tw-text-xs tw-text-white/60 tw-mb-0">
            {droppingTimeState === "UPCOMING" &&
              new Date(participationPeriodMin).toLocaleDateString()}
            {droppingTimeState === "IN_PROGRESS" &&
              new Date(participationPeriodMax).toLocaleDateString()}
            {droppingTimeState === "COMPLETED" &&
              new Date(participationPeriodMax).toLocaleDateString()}
          </p>
        </div>
      </div>

      {droppingTimeState !== "COMPLETED" ? (
        <TimeCountdownDisplay timeLeft={droppingTimeLeft} />
      ) : (
        <TimePhaseStatus 
          phaseState={droppingTimeState} 
          phaseType="Dropping" 
        />
      )}
    </div>
  );
};