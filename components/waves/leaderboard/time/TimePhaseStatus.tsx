import React from "react";

interface TimePhaseStatusProps {
  readonly isCompleted: boolean;
  readonly phaseType: "Dropping" | "Voting";
}

interface TimePhaseTitleProps {
  readonly isCompleted: boolean;
  readonly isUpcoming: boolean;
  readonly isInProgress: boolean;
  readonly phaseType: "Dropping" | "Voting";
}

/**
 * Displays the status of a time phase (Dropping or Voting)
 */
export const TimePhaseStatus: React.FC<TimePhaseStatusProps> = ({
  isCompleted,
  phaseType,
}) => {
  if (isCompleted) {
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
export const TimePhaseTitle: React.FC<TimePhaseTitleProps> = ({
  isCompleted,
  isUpcoming,
  isInProgress,
  phaseType,
}) => {
  return (
    <h2 className="tw-text-sm md:tw-text-base tw-font-medium tw-text-white/90 tw-mb-0">
      {isUpcoming && `${phaseType} Starts In`}
      {isInProgress && `${phaseType} Ends In`}
      {isCompleted && `${phaseType} Complete`}
    </h2>
  );
};
