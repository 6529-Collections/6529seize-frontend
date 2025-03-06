import React from "react";
import { WaveLeaderboardTimeState } from "../../../../helpers/waves/time.types";

interface TimePhaseIconProps {
  readonly phaseState: WaveLeaderboardTimeState;
  readonly color: "emerald" | "violet" | "blue";
}

/**
 * Icon component for time phases
 */
export const TimePhaseIcon: React.FC<TimePhaseIconProps> = ({
  phaseState,
  color,
}) => {
  return (
    <div className={`tw-flex-shrink-0 tw-size-6 md:tw-size-8 tw-rounded-md tw-bg-gradient-to-br tw-from-${color}-300/10 tw-to-${color}-400/5 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-white/10`}>
      {phaseState === WaveLeaderboardTimeState.COMPLETED ? (
        <svg
          className={`tw-w-3 tw-h-3 md:tw-w-4 md:tw-h-4 tw-text-${color}-400/80 tw-flex-shrink-0`}
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
        >
          <path
            d="M20 6L9 17l-5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          className={`tw-w-3 tw-h-3 md:tw-w-4 md:tw-h-4 tw-text-${color}-400/80 tw-flex-shrink-0`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 8v4l2.5 2.5M12 2v2m10 8a10 10 0 11-20 0 10 10 0 0120 0z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
};