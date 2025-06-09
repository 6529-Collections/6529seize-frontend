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
      className="tw-px-4 tw-py-2 tw-bg-iron-900 tw-rounded-t-xl tw-border tw-border-solid tw-border-iron-800 tw-flex tw-items-center tw-justify-between tw-cursor-pointer desktop-hover:hover:tw-bg-iron-800 tw-transition-all tw-duration-300 tw-ease-out tw-group tw-shadow-md"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="tw-flex tw-items-center tw-gap-2">
        <div className="tw-flex tw-items-center tw-gap-2">
          {hasNextDecision && (
            <div className="tw-w-2 tw-h-2 tw-bg-primary-400 tw-rounded-full tw-shadow-[0_0_8px_rgba(99,179,237,0.5)] tw-animate-pulse"></div>
          )}
          <span
              className={`tw-text-xs tw-font-medium ${
                hasNextDecision ? "tw-text-primary-400" : "tw-text-iron-400"
              }`}
          >
            {hasNextDecision ? "Next winner:" : "Announcement history"}
          </span>
        </div>

        {hasNextDecision && <TimeCountdown timeLeft={timeLeft} />}
      </div>

      <div className="tw-flex tw-items-center tw-gap-3">
        <div className="tw-text-sm tw-font-medium">
          {isPaused && currentPause ? (
            <span className="tw-inline-flex tw-items-center tw-gap-2 tw-px-4 tw-py-1.5 tw-rounded-lg tw-text-xs tw-bg-gradient-to-r tw-from-orange-900/15 tw-via-amber-700/15 tw-to-yellow-900/15 tw-border tw-border-amber-500/30">
              <span className="tw-font-bold tw-bg-gradient-to-r tw-from-amber-200 tw-to-orange-200 tw-bg-clip-text tw-text-transparent">
                Congrats to all Season 11 winners!
              </span>
              <span className="tw-text-amber-300/70">•</span>
              <span className="tw-text-amber-200/90">
                S12 starts:{" "}
                {new Date(currentPause.end_time).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </span>
          ) : nextDecisionTime ? (
            <span className="tw-text-iron-300 tw-font-medium tw-text-xs">
              {new Date(nextDecisionTime).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : (
            <span className="tw-text-iron-400">No upcoming events</span>
          )}
        </div>

        <button
          className="tw-w-7 tw-h-7 tw-flex tw-items-center tw-justify-center tw-bg-iron-800/70 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-border-iron-500 tw-transition-all tw-duration-200"
          aria-label={isOpen ? "Collapse" : "Expand"}
        >
          <svg
            className={`tw-w-4 tw-h-4 tw-text-iron-200 desktop-hover:hover:tw-text-white ${
              isOpen ? "tw-rotate-180" : ""
            } tw-transition-all tw-duration-300`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
