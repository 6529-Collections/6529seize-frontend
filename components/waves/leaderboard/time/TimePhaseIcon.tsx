import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

interface TimePhaseIconProps {
  readonly isCompleted: boolean;
  readonly color: "emerald" | "violet" | "blue";
}

/**
 * Icon component for time phases
 */
export const TimePhaseIcon: React.FC<TimePhaseIconProps> = ({
  isCompleted,
  color,
}) => {
  const containerClasses = {
    base: "tw-flex-shrink-0 tw-size-6 md:tw-size-8 tw-rounded-md tw-bg-gradient-to-br tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-white/10",
    emerald: "tw-from-emerald-300/10 tw-to-emerald-400/5",
    violet: "tw-from-violet-300/10 tw-to-violet-400/5",
    blue: "tw-from-blue-300/10 tw-to-blue-400/5",
  };

  const iconClasses = {
    base: "tw-text-xs md:tw-text-sm tw-size-4",
    emerald: "tw-text-emerald-400/80",
    violet: "tw-text-violet-400/80",
    blue: "tw-text-blue-400/80",
  };

  return (
    <div className={`${containerClasses.base} ${containerClasses[color]}`}>
      {isCompleted ? (
        <FontAwesomeIcon
          icon={faCheck}
          className={`${iconClasses.base} ${iconClasses[color]}`}
        />
      ) : (
        <FontAwesomeIcon
          icon={faClock}
          className={`${iconClasses.base} ${iconClasses[color]}`}
        />
      )}
    </div>
  );
};
