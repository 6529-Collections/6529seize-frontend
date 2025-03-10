import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { DecisionPoint } from "../../../../helpers/waves/time.types";
import { TimeLeft } from "../../../../helpers/waves/time.utils";
import { TimeCountdownDisplay } from "./TimeCountdownDisplay";
import { faRepeat } from "@fortawesome/free-solid-svg-icons";
import { AnimatedAccordionContent } from "../../../../components/common/AnimatedAccordionContent";

interface DecisionTimelineProps {
  readonly nextDecisionTime: number | null;
  readonly nextDecisionTimeLeft: TimeLeft;
  readonly upcomingDecisions: DecisionPoint[];
  readonly allDecisions: DecisionPoint[];
  readonly isRollingWave: boolean;
  readonly isDecisionDetailsOpen: boolean;
  readonly setIsDecisionDetailsOpen: (isOpen: boolean) => void;
}

export const DecisionTimeline: React.FC<DecisionTimelineProps> = ({
  nextDecisionTime,
  nextDecisionTimeLeft,
  upcomingDecisions,
  allDecisions,
  isRollingWave,
  isDecisionDetailsOpen,
  setIsDecisionDetailsOpen,
}) => {
  const isDecisionImminent =
    nextDecisionTimeLeft.days === 0 &&
    nextDecisionTimeLeft.hours === 0 &&
    nextDecisionTimeLeft.minutes < 60;

  return (
    <div className="tw-rounded-lg tw-shadow-lg tw-shadow-primary-500/10 tw-transition-all tw-duration-300 tw-bg-gradient-to-br tw-from-[#1E1E2E]/80 tw-via-[#2E2E3E]/60 tw-to-[#3E2E3E]/40 tw-backdrop-blur-sm tw-border tw-border-[#3E2E3E]/20">
      {!isDecisionDetailsOpen ? (
        <div
          className="tw-flex tw-items-center tw-gap-x-2 tw-cursor-pointer tw-rounded-lg tw-px-4 tw-py-3 tw-bg-transparent desktop-hover:hover:tw-bg-white/[0.02] tw-transition tw-duration-300 tw-ease-out"
          onClick={() => setIsDecisionDetailsOpen(true)}
        >
          <div className="tw-flex-shrink-0 tw-size-6 md:tw-size-8 tw-rounded-md tw-bg-gradient-to-br tw-from-emerald-300/10 tw-to-emerald-400/5 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-white/10">
            <FontAwesomeIcon
              icon={faClock}
              className="tw-text-sm md:tw-text-base tw-size-4 tw-text-emerald-400/80 tw-flex-shrink-0"
            />
          </div>
          <div className="tw-flex tw-justify-between tw-items-center tw-w-full">
            <div className="tw-flex tw-items-center tw-gap-x-3">
              {nextDecisionTime ? (
                <>
                  <h2 className="tw-text-xs sm:tw-text-sm tw-text-white/90 tw-font-semibold tw-whitespace-nowrap tw-mb-0">
                    Next winner{" "}
                    <span className="tw-hidden sm:tw-inline">
                      announcement in
                    </span>
                    :
                  </h2>
                  <div className="tw-flex tw-items-center">
                    <div className="tw-mx-0.5 tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                      <span className="tw-text-sm sm:tw-text-base tw-font-semibold tw-text-white/90">
                        {nextDecisionTimeLeft.days}
                      </span>
                      <span className="tw-text-[10px] sm:tw-text-xs tw-uppercase tw-text-white/40 tw-ml-1">
                        days
                      </span>
                    </div>
                    <div className="tw-mx-0.5 tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                      <span className="tw-text-sm sm:tw-text-base tw-font-semibold tw-text-white/90">
                        {nextDecisionTimeLeft.hours}
                      </span>
                      <span className="tw-text-[10px] sm:tw-text-xs tw-uppercase tw-text-white/900 tw-ml-1">
                        hrs
                      </span>
                    </div>
                    <div className="tw-mx-0.5 tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                      <span className="tw-text-sm sm:tw-text-base tw-font-semibold tw-text-white/90">
                        {nextDecisionTimeLeft.minutes}
                      </span>
                      <span className="tw-text-[10px] sm:tw-text-xs tw-uppercase tw-text-white/40 tw-ml-1">
                        min
                      </span>
                    </div>
                    <div className="tw-mx-0.5 tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                      <span className="tw-text-sm sm:tw-text-base tw-font-semibold tw-text-white/90">
                        {nextDecisionTimeLeft.seconds}
                      </span>
                      <span className="tw-text-[10px] sm:tw-text-xs tw-uppercase tw-text-white/40 tw-ml-1">
                        sec
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <h2 className="tw-text-xs sm:tw-text-sm tw-text-white/90 tw-font-semibold tw-whitespace-nowrap tw-mb-0">
                  Announcement history
                </h2>
              )}
            </div>
            <div className="tw-flex tw-items-center tw-ml-2">
              <svg
                className="tw-w-5 tw-h-5 tw-text-iron-300 tw-flex-shrink-0"
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
      ) : (
        <div
          className="tw-flex tw-items-center tw-gap-x-2 tw-gap-y-2 tw-cursor-pointer tw-rounded-lg tw-px-4 tw-py-3 tw-bg-transparent desktop-hover:hover:tw-bg-white/[0.02] tw-transition tw-duration-300 tw-ease-out"
          onClick={() => setIsDecisionDetailsOpen(false)}
        >
          <div className="tw-flex-shrink-0 tw-size-6 md:tw-size-8 tw-rounded-md tw-bg-gradient-to-br tw-from-emerald-300/10 tw-to-emerald-400/5 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-white/10">
            <FontAwesomeIcon
              icon={faClock}
              className="tw-text-sm md:tw-text-base tw-size-4 tw-text-emerald-400/80 tw-flex-shrink-0"
            />
          </div>
          <div className="tw-flex tw-justify-between tw-items-center tw-w-full">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <h2 className="tw-text-sm tw-text-white/90 tw-font-semibold tw-mb-0">
                {nextDecisionTime
                  ? "Next winner announcement"
                  : "Announcement history"}
              </h2>
            </div>
            <div className="tw-flex tw-items-center">
              <svg
                className="tw-w-5 tw-h-5 tw-text-iron-300 tw-rotate-180 tw-flex-shrink-0"
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
      )}

      <AnimatedAccordionContent isVisible={isDecisionDetailsOpen && !!nextDecisionTime} duration={0.3}>
        <div className="tw-px-4 tw-pt-2">
          <TimeCountdownDisplay timeLeft={nextDecisionTimeLeft} size="small" />
        </div>
      </AnimatedAccordionContent>

      <AnimatedAccordionContent isVisible={isDecisionDetailsOpen} duration={0.3}>
        <div className="tw-mt-2 tw-px-4 tw-pb-3">
          <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-white/10">
            <div className="tw-relative tw-py-2">
              <div className="tw-ml-2.5 tw-relative">
                <div className="tw-absolute tw-w-0.5 tw-bg-white/10 tw-top-0 tw-bottom-0 tw-left-2"></div>
                <div className="tw-flex tw-flex-col tw-gap-4 tw-max-h-[300px] tw-pr-2 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-pl-2">
                  {allDecisions.map((decision, index) => (
                    <div
                      key={decision.id}
                      className="tw-flex tw-items-start tw-relative tw-pl-5"
                    >
                      <div
                        className={`tw-absolute tw-left-0 tw-ml-[1px] tw-top-1 tw-transform -tw-translate-x-1/2 tw-flex tw-items-center tw-justify-center ${
                          nextDecisionTime &&
                          decision.timestamp === nextDecisionTime
                            ? "tw-w-4 tw-h-4"
                            : "tw-w-3 tw-h-3"
                        }`}
                      >
                        {nextDecisionTime &&
                          decision.timestamp === nextDecisionTime && (
                            <span className="tw-animate-ping tw-absolute tw-inline-flex tw-h-full tw-w-full tw-rounded-full tw-bg-primary-400/40"></span>
                          )}
                        <span
                          className={`tw-relative tw-inline-flex tw-rounded-full ${
                            nextDecisionTime &&
                            decision.timestamp === nextDecisionTime
                              ? "tw-w-4 tw-h-4 tw-bg-primary-400"
                              : "tw-w-3 tw-h-3 tw-border tw-border-white/20 tw-bg-iron-700"
                          }`}
                        ></span>
                      </div>
                      <div className="tw-flex tw-justify-between tw-items-center tw-w-full tw-mt-0.5">
                        <div>
                          <p
                            className={`tw-text-xs tw-font-medium ${
                              nextDecisionTime &&
                              decision.timestamp === nextDecisionTime
                                ? "tw-text-white/90"
                                : "tw-text-white/60"
                            }`}
                          >
                            {new Date(decision.timestamp).toLocaleDateString(
                              undefined,
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                            {nextDecisionTime &&
                              decision.timestamp === nextDecisionTime && (
                                <span className="tw-ml-1.5 tw-inline-flex tw-items-center tw-rounded-full tw-bg-primary-500/20 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-primary-400">
                                  Next
                                </span>
                              )}
                            {decision.isPast && (
                              <span className="tw-ml-1.5 tw-inline-flex tw-items-center tw-rounded-full tw-px-1.5 tw-text-[10px] tw-font-medium tw-text-iron-500">
                                Complete
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="tw-text-right tw-text-xs tw-tabular-nums tw-text-white/50 tw-font-mono">
                          {new Date(decision.timestamp).toLocaleTimeString(
                            undefined,
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                      {nextDecisionTime &&
                        decision.timestamp === nextDecisionTime &&
                        isRollingWave && (
                          <div className="tw-absolute tw-left-0 tw-top-1 tw-transform -tw-translate-x-7">
                            <FontAwesomeIcon
                              icon={faRepeat}
                              className="tw-text-xs tw-text-white/30 tw-flex-shrink-0"
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
      </AnimatedAccordionContent>
    </div>
  );
};
