import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
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
        <FontAwesomeIcon
          icon={faCheck}
          className={`tw-text-${color}-400/80 tw-text-xs md:tw-text-sm tw-size-4`}
        />
      ) : (
        <FontAwesomeIcon
          icon={faClock}
          className={`tw-text-${color}-400/80 tw-text-xs md:tw-text-sm tw-size-4`}
        />
      )}
    </div>
  );
};