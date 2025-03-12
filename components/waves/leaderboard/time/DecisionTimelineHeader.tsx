import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { TimeLeft, isTimeZero } from "../../../../helpers/waves/time.utils";
import { TimeUnit } from "./TimeUnit";

interface DecisionTimelineHeaderProps {
  readonly isOpen: boolean;
  readonly setIsOpen: (isOpen: boolean) => void;
  readonly icon: IconDefinition;
  readonly timeLeft: TimeLeft;
  readonly hasNextDecision: boolean;
}

/**
 * Renders the collapsible header for the decision timeline
 */
export const DecisionTimelineHeader: React.FC<DecisionTimelineHeaderProps> = ({
  isOpen,
  setIsOpen,
  icon,
  timeLeft,
  hasNextDecision,
}) => {
  return (
    <div
      className="tw-flex tw-items-center tw-gap-x-2 tw-cursor-pointer tw-rounded-lg tw-px-4 tw-py-3 tw-bg-transparent desktop-hover:hover:tw-bg-white/[0.02] tw-transition tw-duration-300 tw-ease-out"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="tw-flex-shrink-0 tw-size-6 md:tw-size-8 tw-rounded-md tw-bg-gradient-to-br tw-from-emerald-300/10 tw-to-emerald-400/5 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-white/10">
        <FontAwesomeIcon
          icon={icon}
          className="tw-text-sm md:tw-text-base tw-size-4 tw-text-emerald-400/80 tw-flex-shrink-0"
        />
      </div>
      <div className="tw-flex tw-justify-between tw-items-center tw-w-full">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          {hasNextDecision && !isTimeZero(timeLeft) ? (
            <>
              <h2 className="tw-text-xs sm:tw-text-sm tw-text-white/90 tw-font-semibold tw-whitespace-nowrap tw-mb-0">
                {isOpen ? "Next winner announcement" : "Next winner "}
                {!isOpen && (
                  <span className="tw-hidden sm:tw-inline">
                    announcement in
                  </span>
                )}
                {!isOpen && ":"}
              </h2>
              {!isOpen && (
                <div className="tw-flex tw-items-center">
                  <TimeUnit value={timeLeft.days} label="days" />
                  <TimeUnit value={timeLeft.hours} label="hours" shortLabel="hrs" />
                  <TimeUnit value={timeLeft.minutes} label="minutes" shortLabel="min" />
                  <TimeUnit value={timeLeft.seconds} label="seconds" shortLabel="sec" />
                </div>
              )}
            </>
          ) : (
            <h2 className="tw-text-xs sm:tw-text-sm tw-text-white/90 tw-font-semibold tw-whitespace-nowrap tw-mb-0">
              Announcement history
            </h2>
          )}
        </div>
        <div className="tw-flex tw-items-center tw-ml-2">
          <svg
            className={`tw-w-5 tw-h-5 tw-text-iron-300 tw-flex-shrink-0 ${
              isOpen ? "tw-rotate-180" : ""
            }`}
            fill="none"
            aria-hidden="true"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};