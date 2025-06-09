import React from "react";
import {
  calculateTimeLeft,
  TimeLeft,
} from "../../../../helpers/waves/time.utils";
import { TimeCountdown } from "./TimeCountdown";
import { ApiWaveDecisionPause } from "../../../../generated/models/ApiWaveDecisionPause";

interface TimelineToggleHeaderProps {
  readonly isOpen: boolean;
  readonly setIsOpen: (isOpen: boolean) => void;
  readonly nextDecisionTime: number | null;
  readonly isPaused?: boolean;
  readonly currentPause?: ApiWaveDecisionPause | null;
}

/**
 * Renders the header for the timeline with toggle functionality
 */
export const TimelineToggleHeader: React.FC<TimelineToggleHeaderProps> = ({
  isOpen,
  setIsOpen,
  nextDecisionTime,
  isPaused = false,
  currentPause,
}) => {
  const hasNextDecision = !!nextDecisionTime;
  const getTimeLeft = () => {
    if (hasNextDecision) {
      return calculateTimeLeft(nextDecisionTime);
    }
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  };

  const [timeLeft, setTimeLeft] = React.useState<TimeLeft>(getTimeLeft());

  React.useEffect(() => {
    // Initial calculation
    setTimeLeft(getTimeLeft());

    // Only set up interval if there's a next decision and time remaining
    if (hasNextDecision) {
      const intervalId = setInterval(() => {
        const newTimeLeft = getTimeLeft();
        setTimeLeft(newTimeLeft);

        // Clear interval when countdown reaches zero
        if (
          newTimeLeft.days === 0 &&
          newTimeLeft.hours === 0 &&
          newTimeLeft.minutes === 0 &&
          newTimeLeft.seconds === 0
        ) {
          clearInterval(intervalId);
        }
      }, 1000);

      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [nextDecisionTime, hasNextDecision]);

  return (
    <div
      className="tw-px-3 tw-py-2 tw-group tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-flex tw-items-center tw-justify-between tw-cursor-pointer desktop-hover:hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="tw-flex tw-items-center tw-w-full sm:tw-w-auto">
        <div className="tw-flex tw-items-center">
          <div
            className={`tw-text-xs tw-font-semibold ${
              hasNextDecision ? "tw-text-primary-400" : "tw-text-iron-300"
            }`}
          >
            {hasNextDecision ? "Next winner:" : "Announcement history"}
          </div>
        </div>
        {hasNextDecision && (
          <div className="tw-ml-2">
            <TimeCountdown timeLeft={timeLeft} />
          </div>
        )}
      </div>
      <div className="tw-flex tw-items-center tw-ml-auto">
        <div className="tw-text-xs tw-mr-4 tw-whitespace-nowrap">
          {isPaused && currentPause ? (
            <div className="tw-flex tw-items-center tw-gap-1">
              <span className="tw-text-yellow-500 tw-text-xs tw-font-medium">
                Paused:
              </span>
              <span className="tw-text-xs tw-text-iron-400">
                {new Date(currentPause.start_time).toLocaleDateString(
                  undefined,
                  {
                    month: "short",
                    day: "numeric",
                  }
                )}
                {" - "}
                {new Date(currentPause.end_time).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          ) : nextDecisionTime ? (
            <span className="tw-text-iron-400">
              {new Date(nextDecisionTime).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : (
            <span className="tw-text-iron-400">No upcoming decisions</span>
          )}
        </div>
        <div className="tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-bg-iron-650 tw-rounded-full tw-border tw-border-solid tw-border-iron-600 desktop-hover:group-hover:tw-bg-iron-600 tw-transition-colors tw-duration-200">
          <svg
            className={`tw-w-4 tw-h-4 tw-text-iron-300 ${
              isOpen ? "tw-rotate-180" : ""
            } tw-transition-transform tw-duration-300`}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            stroke="currentColor"
          >
            <path
              d="M19 9l-7 7-7-7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
