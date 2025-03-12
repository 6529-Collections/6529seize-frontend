import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useDecisionPoints } from "../../../hooks/waves/useDecisionPoints";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-regular-svg-icons";
// Import only CompactDroppingPhaseCard and CompactVotingPhaseCard
// but comment them out for now
// import { CompactDroppingPhaseCard } from "./time/CompactDroppingPhaseCard";
// import { CompactVotingPhaseCard } from "./time/CompactVotingPhaseCard";

interface WaveLeaderboardTimeProps {
  readonly wave: ApiWave;
}

/**
 * Component for displaying wave time information focusing on next winner announcement
 * in a compact format with expandable timeline
 */
export const WaveLeaderboardTime: React.FC<WaveLeaderboardTimeProps> = ({
  wave,
}) => {
  // Using decision points hooks
  const {
    isMultiDecisionWave,
    isRollingWave,
    isDecisionDetailsOpen,
    setIsDecisionDetailsOpen,
    nextDecisionTime,
    upcomingDecisions,
    allDecisions,
    nextDecisionTimeLeft,
  } = useDecisionPoints(wave);

  // Format next decision time as a readable date string
  const formattedNextDecisionTime = nextDecisionTime
    ? new Date(nextDecisionTime).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : "No upcoming decisions";

  return (
    <div className="tw-mb-4">
      {/* Main container */}
      <div className="tw-rounded-lg tw-bg-iron-950 tw-overflow-hidden">
        {/* Header section with title, countdown and date */}
        <div
          className="tw-px-3 tw-py-2 tw-group tw-bg-iron-950 tw-flex tw-items-center tw-justify-between tw-cursor-pointer  desktop-hover:hover:tw-bg-iron-900 tw-transition tw-duration-300 tw-ease-out"
          onClick={() => setIsDecisionDetailsOpen(!isDecisionDetailsOpen)}
        >
          {/* Left side with title and countdown boxes */}
          <div className="tw-flex tw-items-center tw-flex-wrap">
            {/* Title with clock icon */}
            <div className="tw-flex tw-items-center tw-mr-3">
              <div className="tw-flex-shrink-0 tw-mr-2 tw-text-emerald-400">
                <FontAwesomeIcon
                  icon={faClock}
                  className="tw-size-4 tw-flex-shrink-0"
                />
              </div>
              <div className="tw-text-xs tw-text-iron-300">
                {nextDecisionTime
                  ? "Next winner announcement"
                  : "Announcement history"}
              </div>
            </div>

            {/* Countdown boxes right after title - only show when nextDecisionTime exists */}
            {nextDecisionTime && nextDecisionTimeLeft && (
              <div className="tw-flex tw-gap-1.5">
                {/* Days */}
                {nextDecisionTimeLeft.days > 0 && (
                  <div className="tw-bg-primary-300/5 tw-border tw-border-primary-300/10 tw-rounded tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium">
                    <span className="tw-text-iron-100">
                      {nextDecisionTimeLeft.days}
                    </span>
                    <span className="tw-uppercase tw-text-iron-400 tw-ml-1 tw-text-[10px]">
                      DAYS
                    </span>
                  </div>
                )}
                {/* Hours - always show even if 0 */}
                <div className="tw-bg-primary-300/5 tw-border tw-border-primary-300/10 tw-rounded tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium">
                  <span className="tw-text-iron-100">
                    {nextDecisionTimeLeft.hours}
                  </span>
                  <span className="tw-uppercase tw-text-iron-400 tw-ml-1 tw-text-[10px]">
                    HRS
                  </span>
                </div>
                {/* Minutes */}
                <div className="tw-bg-primary-300/5 tw-border tw-border-primary-300/10 tw-rounded tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium">
                  <span className="tw-text-iron-100">
                    {nextDecisionTimeLeft.minutes}
                  </span>
                  <span className="tw-uppercase tw-text-iron-400 tw-ml-1 tw-text-[10px]">
                    MIN
                  </span>
                </div>
                {/* Seconds */}
                <div className="tw-bg-primary-300/5 tw-border tw-border-primary-300/10 tw-rounded tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium">
                  <span className="tw-text-iron-100">
                    {nextDecisionTimeLeft.seconds}
                  </span>
                  <span className="tw-uppercase tw-text-iron-400 tw-ml-1 tw-text-[10px]">
                    SEC
                  </span>
                </div>
              </div>
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
                  isDecisionDetailsOpen ? "tw-rotate-180" : ""
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

        {/* Expandable timeline section */}
        <AnimatePresence>
          {isDecisionDetailsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="tw-bg-iron-950"
            >
              {/* Horizontal Timeline View */}
              <div className="tw-px-3 tw-py-4">
                <div className="tw-overflow-hidden tw-rounded-lg">
                  <div className="tw-relative">
                    {/* Scrollable container */}
                    <div className="tw-overflow-x-auto tw-pb-2 tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
                      {/* Flexbox timeline with fixed width elements */}
                      <div className="tw-flex tw-gap-4 tw-max-w-20 tw-mx-4">
                        {allDecisions.map((decision, index) => {
                          const isNext =
                            nextDecisionTime &&
                            decision.timestamp === nextDecisionTime;
                          const isPast = decision.isPast;

                          return (
                            <div
                              key={decision.id}
                              className="tw-relative tw-flex tw-flex-col tw-items-center tw-z-10 tw-flex-shrink-0 tw-w-[80px]"
                            >
                              {/* Dot indicator ABOVE the line */}
                              <div className="tw-mb-3 tw-z-10">
                                <div
                                  className={`tw-w-3 tw-h-3 tw-rounded-full ${
                                    isNext
                                      ? "tw-bg-primary-400 tw-ring-2 tw-ring-primary-400/30"
                                      : isPast
                                      ? "tw-bg-iron-600"
                                      : "tw-bg-iron-900 tw-border tw-border-solid tw-border-iron-700"
                                  }`}
                                ></div>
                              </div>

                              {/* Information BELOW the line */}
                              <div className="tw-mt-2 tw-z-10 tw-text-center">
                                {/* Status badge - only for next or past */}
                                {isNext && (
                                  <span className="tw-flex tw-justify-center tw-mb-1">
                                    <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-primary-500/20 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-primary-400">
                                      Next
                                    </span>
                                  </span>
                                )}
                                {isPast && (
                                  <span className="tw-flex tw-justify-center tw-mb-1">
                                    <span className="tw-inline-flex tw-items-center tw-rounded-full tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-iron-500">
                                      Completed
                                    </span>
                                  </span>
                                )}

                                {/* Date text */}
                                <div
                                  className={`tw-text-xs ${
                                    isNext
                                      ? "tw-text-iron-100"
                                      : "tw-text-iron-400"
                                  } tw-font-medium`}
                                >
                                  {new Date(
                                    decision.timestamp
                                  ).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </div>

                                {/* Time text */}
                                <div className="tw-text-xs tw-text-iron-500 tw-mt-0.5 tw-font-mono">
                                  {new Date(
                                    decision.timestamp
                                  ).toLocaleTimeString(undefined, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Horizontal line BETWEEN dots and information */}
                        <div className="tw-absolute tw-h-0.5 tw-bg-iron-800 tw-left-0 tw-right-0 tw-top-[20px]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Commented out phase cards 
      <div className="tw-flex tw-items-center tw-flex-wrap tw-mt-2 tw-gap-y-1">
        <CompactDroppingPhaseCard wave={wave} />
        <div className="tw-mt-1">
          <div className="tw-h-1.5 tw-w-1.5 tw-rounded-full tw-bg-white/20"></div>
        </div>
        <CompactVotingPhaseCard wave={wave} />
      </div>
      */}
    </div>
  );
};
