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
      className="tw-@container tw-px-4 tw-py-2 tw-bg-iron-800/95 tw-rounded-t-lg tw-border tw-border-solid tw-border-iron-700/50 tw-cursor-pointer desktop-hover:hover:tw-bg-iron-700/80 tw-transition-all tw-duration-300 tw-ease-out tw-group tw-shadow-sm"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="tw-flex tw-flex-col @[700px]:tw-flex-row tw-items-start @[700px]:tw-items-center tw-gap-2">
        {/* Mobile: Row 1 - Countdown + Chevron | Desktop: Left section */}
        <div className="tw-flex tw-items-center tw-justify-between tw-w-full @[700px]:tw-w-auto @[700px]:tw-flex-1">
          <div className="tw-flex tw-items-baseline tw-gap-x-2">
            <span
              className={`tw-text-sm tw-font-semibold tw-whitespace-nowrap tw-tracking-tight ${
                hasNextDecision ? "tw-text-iron-100" : "tw-text-iron-400"
              }`}
            >
              {hasNextDecision ? "Next winner:" : "Announcement history"}
            </span>

            {hasNextDecision && (
              <div>
                <TimeCountdown timeLeft={timeLeft} />
              </div>
            )}
          </div>

          {/* Chevron - visible on mobile, hidden on desktop */}
          <button
            className="tw-w-7 tw-h-7 tw-flex @[700px]:tw-hidden tw-items-center tw-justify-center tw-bg-iron-700/50 tw-rounded-md tw-border tw-border-solid tw-border-iron-600/40 desktop-hover:hover:tw-bg-iron-600/60 desktop-hover:hover:tw-border-iron-500/50 tw-transition-all tw-duration-300 tw-ease-out tw-flex-shrink-0"
            aria-label={isOpen ? "Collapse" : "Expand"}
          >
            <svg
              className={`tw-w-4 tw-h-4 tw-text-iron-200 desktop-hover:group-hover:tw-text-iron-100 ${
                isOpen ? "tw-rotate-180" : ""
              } tw-transition-all tw-duration-300 tw-ease-in-out`}
              viewBox="0 0 20 20"
              aria-hidden="true"
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


        <div className="tw-text-sm tw-font-medium">
          {isPaused && currentPause ? (
            <span className="tw-flex tw-items-center tw-gap-2.5 tw-px-3 tw-py-1.5 tw-rounded-md tw-text-xs tw-bg-gradient-to-r tw-from-iron-800/90 tw-to-iron-700/70 group-hover:tw-from-iron-700/60 group-hover:tw-to-iron-600/40 tw-border tw-border-iron-600/40 group-hover:tw-border-iron-600/30 tw-border-solid tw-shadow-sm group-hover:tw-shadow-none tw-transition-all tw-duration-300 tw-ease-out">
              <span className="tw-font-bold tw-bg-gradient-to-r tw-from-amber-200 tw-via-amber-100 tw-to-amber-200/90 tw-bg-clip-text tw-text-transparent tw-whitespace-nowrap">
                Congrats to all Season 11 winners!
              </span>
              <span className="tw-text-iron-500">•</span>
              <span className="tw-text-iron-300 tw-font-medium tw-whitespace-nowrap">
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
            <span className="tw-text-iron-400 tw-text-xs">
              No upcoming events
            </span>
          )}
        </div>

        {/* Chevron - visible on desktop, hidden on mobile */}
        <button
          className="tw-w-7 tw-h-7 tw-hidden @[700px]:tw-flex tw-items-center tw-justify-center tw-bg-iron-700/50 tw-rounded-md tw-border tw-border-solid tw-border-iron-600/40 desktop-hover:hover:tw-bg-iron-600/60 desktop-hover:hover:tw-border-iron-500/50 tw-transition-all tw-duration-300 tw-ease-out tw-flex-shrink-0"
          aria-label={isOpen ? "Collapse" : "Expand"}
        >
          <svg
            className={`tw-w-4 tw-h-4 tw-text-iron-200 desktop-hover:group-hover:tw-text-iron-100 ${
              isOpen ? "tw-rotate-180" : ""
            } tw-transition-all tw-duration-300 tw-ease-in-out`}
            viewBox="0 0 20 20"
            aria-hidden="true"
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
