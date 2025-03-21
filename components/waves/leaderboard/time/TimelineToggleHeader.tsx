import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { TimeLeft } from "../../../../helpers/waves/time.utils";
import { TimeCountdown } from "./TimeCountdown";

interface TimelineToggleHeaderProps {
  readonly icon: IconDefinition;
  readonly isOpen: boolean;
  readonly setIsOpen: (isOpen: boolean) => void;
  readonly hasNextDecision: boolean;
  readonly nextDecisionTime: number | null;
  readonly timeLeft: TimeLeft;
}

/**
 * Renders the header for the timeline with toggle functionality
 */
export const TimelineToggleHeader: React.FC<TimelineToggleHeaderProps> = ({
  icon,
  isOpen,
  setIsOpen,
  hasNextDecision,
  nextDecisionTime,
  timeLeft
}) => {
  return (
    <div
      className="tw-px-3 tw-py-2 tw-group tw-bg-iron-900 tw-flex tw-items-center tw-justify-between tw-cursor-pointer desktop-hover:hover:tw-bg-iron-800/60 tw-transition tw-duration-300 tw-ease-out"
      onClick={() => setIsOpen(!isOpen)}
    >
      {/* Left side with title and countdown boxes */}
      <div className="tw-flex tw-items-center tw-flex-wrap">
        {/* Title with clock icon */}
        <div className="tw-flex tw-items-center tw-mr-3">
          <div className="tw-flex-shrink-0 tw-mr-2 tw-text-emerald-400">
            <FontAwesomeIcon
              icon={icon}
              className="tw-size-4 tw-flex-shrink-0"
            />
          </div>
          <div className="tw-text-xs tw-text-iron-300">
            {hasNextDecision
              ? "Next winner announcement"
              : "Announcement history"}
          </div>
        </div>

        {/* Countdown boxes right after title - only show when nextDecisionTime exists */}
        {hasNextDecision && (
          <TimeCountdown timeLeft={timeLeft} />
        )}
      </div>

      {/* Right side - Date and chevron */}
      <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-ml-auto">
        <div className="tw-text-xs tw-text-iron-400 tw-mr-2 tw-whitespace-nowrap">
          {nextDecisionTime
            ? new Date(nextDecisionTime).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "No upcoming decisions"}
        </div>

        {/* Chevron toggle  */}
        <div className="tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-bg-iron-700 tw-rounded-full tw-border tw-border-iron-700 desktop-hover:group-hover:tw-bg-iron-650 tw-transition-colors tw-duration-200">
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
