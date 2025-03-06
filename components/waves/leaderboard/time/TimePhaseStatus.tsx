import React from "react";
import { WaveLeaderboardTimeState } from "../../../../helpers/waves/time.types";

interface TimePhaseStatusProps {
  readonly phaseState: WaveLeaderboardTimeState;
  readonly phaseType: "Dropping" | "Voting";
}

/**
 * Displays the status of a time phase (Dropping or Voting)
 */
export const TimePhaseStatus: React.FC<TimePhaseStatusProps> = ({
  phaseState,
  phaseType,
}) => {
  if (phaseState === WaveLeaderboardTimeState.COMPLETED) {
    return (
      <div className="tw-text-xs tw-text-white/60 tw-bg-white/5 tw-rounded-md tw-py-1.5 tw-px-2.5 tw-text-center">
        The {phaseType.toLowerCase()} phase has ended
      </div>
    );
  }

  return null;
};

/**
 * Displays the title for a time phase based on its state
 */
export const TimePhaseTitle: React.FC<TimePhaseStatusProps> = ({
  phaseState,
  phaseType,
}) => {
  return (
    <h2 className="tw-text-sm md:tw-text-base tw-font-medium tw-text-white/90 tw-mb-0">
      {phaseState === WaveLeaderboardTimeState.UPCOMING &&
        `${phaseType} Starts In`}
      {phaseState === WaveLeaderboardTimeState.IN_PROGRESS &&
        `${phaseType} Ends In`}
      {phaseState === WaveLeaderboardTimeState.COMPLETED &&
        `${phaseType} Complete`}
    </h2>
  );
};