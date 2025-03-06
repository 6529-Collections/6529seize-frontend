import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faRepeat } from "@fortawesome/free-solid-svg-icons";
import { DecisionPoint } from "../../../../helpers/waves/time.types";
import { TimeLeft } from "../../../../helpers/waves/time.utils";
import { TimeCountdownDisplay } from "./TimeCountdownDisplay";

interface DecisionTimelineProps {
  readonly nextDecisionTime: number | null;
  readonly nextDecisionTimeLeft: TimeLeft;
  readonly upcomingDecisions: DecisionPoint[];
  readonly isRollingWave: boolean;
  readonly isDecisionDetailsOpen: boolean;
  readonly setIsDecisionDetailsOpen: (isOpen: boolean) => void;
}

/**
 * Component for displaying decision timeline for multi-decision waves
 */
export const DecisionTimeline: React.FC<DecisionTimelineProps> = ({
  nextDecisionTime,
  nextDecisionTimeLeft,
  upcomingDecisions,
  isRollingWave,
  isDecisionDetailsOpen,
  setIsDecisionDetailsOpen,
}) => {
  if (!nextDecisionTime) {
    return null;
  }

  return (
    <div className="tw-mt-3">
      <div className="tw-rounded-lg tw-bg-gradient-to-br tw-from-[#1E1E2E]/80 tw-via-[#2E2E3E]/60 tw-to-[#3E2E3E]/40 tw-backdrop-blur-sm tw-border tw-border-[#3E2E3E]/20">
        {/* Main Header Row */}
        <div
          className="tw-flex tw-items-center tw-gap-x-3 tw-gap-y-2 tw-cursor-pointer tw-rounded-lg tw-px-4 tw-py-3 tw-bg-transparent desktop-hover:hover:tw-bg-white/[0.02] tw-transition tw-duration-300 tw-ease-out"
          onClick={() => setIsDecisionDetailsOpen(!isDecisionDetailsOpen)}
        >
          {/* Icon - Calendar for regular multi-decision wave, Recurring for rolling wave */}
          <div className="tw-flex-shrink-0 tw-size-6 md:tw-size-7 tw-rounded-md tw-bg-gradient-to-br tw-from-blue-300/10 tw-to-blue-400/5 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-white/10">
            <FontAwesomeIcon
              icon={isRollingWave ? faRepeat : faCalendarDays}
              className="tw-text-blue-400/80 tw-text-sm md:tw-text-base tw-size-4"
            />
          </div>

          {/* Title and Date */}
          <div className="tw-flex tw-justify-between tw-items-center tw-w-full">
            <div className="tw-flex tw-items-center">
              <h2 className="tw-text-sm tw-font-medium tw-text-white/90 tw-mb-0">
                Next winner announcement in
              </h2>
              {!isDecisionDetailsOpen && (
                <TimeCountdownDisplay 
                  timeLeft={nextDecisionTimeLeft}
                  compact={true}
                />
              )}
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
              {/* Date Badge */}
              <span className="tw-text-xs tw-text-white/60 tw-bg-white/5 tw-rounded-md tw-px-2 tw-py-0.5">
                {new Date(nextDecisionTime).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>

              {/* Expand/Collapse indicator */}
              <svg
                className={`tw-w-4 tw-h-4 tw-text-white/60 tw-transition-transform tw-duration-300 ${
                  isDecisionDetailsOpen ? "tw-rotate-180" : ""
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

        {/* Time boxes - Shown when section is expanded */}
        {isDecisionDetailsOpen && (
          <div className="tw-px-4 tw-pt-2">
            <TimeCountdownDisplay 
              timeLeft={nextDecisionTimeLeft} 
              size="small"
            />
          </div>
        )}

        {/* Expanded Timeline Section */}
        {isDecisionDetailsOpen && (
          <div className="tw-mt-2 tw-px-4 tw-pb-3">
            {/* Detailed Vertical Timeline */}
            <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-white/10">
              <div className="tw-relative tw-py-2">
                {/* Timeline Structure */}
                <div className="tw-ml-2.5 tw-relative">
                  {/* Vertical Connecting Line */}
                  <div className="tw-absolute tw-w-0.5 tw-bg-white/10 tw-top-0 tw-bottom-0 tw-left-0"></div>

                  {/* Timeline Nodes - Vertical */}
                  <div className="tw-flex tw-flex-col tw-gap-4">
                    {upcomingDecisions.map((decision, index) => (
                      <div
                        key={decision.id}
                        className="tw-flex tw-items-start tw-relative tw-pl-5"
                      >
                        {/* Node */}
                        <div
                          className={`tw-absolute tw-left-0 tw-top-1 tw-transform -tw-translate-x-1/2 tw-flex tw-items-center tw-justify-center ${
                            index === 0
                              ? "tw-w-4 tw-h-4"
                              : "tw-w-3 tw-h-3"
                          }`}
                        >
                          {index === 0 && (
                            <span className="tw-animate-ping tw-absolute tw-inline-flex tw-h-full tw-w-full tw-rounded-full tw-bg-primary-400/40"></span>
                          )}
                          <span
                            className={`tw-relative tw-inline-flex tw-rounded-full ${
                              index === 0
                                ? "tw-w-4 tw-h-4 tw-bg-primary-400"
                                : "tw-w-3 tw-h-3 tw-border tw-border-white/20 tw-bg-iron-700"
                            }`}
                          ></span>
                        </div>

                        {/* Content */}
                        <div className="tw-flex tw-justify-between tw-items-center tw-w-full tw-mt-0.5">
                          <div>
                            <p
                              className={`tw-text-xs tw-font-medium ${
                                index === 0
                                  ? "tw-text-white/90"
                                  : "tw-text-white/60"
                              }`}
                            >
                              {new Date(
                                decision.timestamp
                              ).toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                              {index === 0 && (
                                <span className="tw-ml-1.5 tw-inline-flex tw-items-center tw-rounded-full tw-bg-primary-500/20 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-primary-400">
                                  Next
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="tw-text-right tw-text-xs tw-tabular-nums tw-text-white/50 tw-font-mono">
                            {new Date(
                              decision.timestamp
                            ).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>

                        {/* Optional rolling indicator for first item */}
                        {index === 0 && isRollingWave && (
                          <div className="tw-absolute tw-left-0 tw-top-1 tw-transform -tw-translate-x-7">
                            <FontAwesomeIcon
                              icon={faRepeat}
                              className="tw-text-xs tw-text-white/30"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};