"use client";

import type { FC } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import type { ApiWaveDecisionPause } from "@/generated/models/ApiWaveDecisionPause";
import type { TimeLeft } from "@/helpers/waves/time.utils";
import { CompactTimeCountdown } from "./CompactTimeCountdown";

interface TimelineToggleHeaderProps {
  readonly isOpen: boolean;
  readonly setIsOpen: (isOpen: boolean) => void;
  readonly nextDecisionTime: number | null;
  readonly timeLeft: TimeLeft;
  readonly isPaused?: boolean | undefined;
  readonly currentPause?: ApiWaveDecisionPause | null | undefined;
}

/**
 * Renders the header for the timeline with toggle functionality
 */
export const TimelineToggleHeader: FC<TimelineToggleHeaderProps> = ({
  isOpen,
  setIsOpen,
  nextDecisionTime,
  timeLeft,
  isPaused = false,
  currentPause,
}) => {
  const hasNextDecision = typeof nextDecisionTime === "number";
  const formattedNextDecisionDate = hasNextDecision
    ? new Date(nextDecisionTime).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Extract the status display logic
  const getStatusDisplay = () => {
    if (isPaused && currentPause) {
      return (
        <span className="tw-inline-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-[11px]">
          <span className="tw-flex-shrink-0 tw-whitespace-nowrap tw-rounded-full tw-bg-amber-400/10 tw-px-2 tw-py-1 tw-font-semibold tw-leading-none tw-text-amber-300">
            Paused
          </span>
          <span className="tw-truncate tw-font-medium tw-text-iron-400">
            {hasNextDecision
              ? `Next decision after ${new Date(
                  nextDecisionTime
                ).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}`
              : "No decision scheduled"}
          </span>
        </span>
      );
    }

    if (hasNextDecision) {
      return (
        <span className="tw-flex tw-min-w-0 tw-flex-nowrap tw-items-center tw-justify-end tw-gap-1">
          <CompactTimeCountdown timeLeft={timeLeft} />
          <span
            className="tw-hidden tw-h-3 tw-w-px tw-flex-shrink-0 tw-bg-white/[0.12] @[30rem]/timeline:tw-block"
            aria-hidden="true"
          />
          <span className="tw-hidden tw-flex-shrink-0 tw-whitespace-nowrap tw-text-[11px] tw-font-medium tw-leading-none tw-text-iron-500 @[30rem]/timeline:tw-inline">
            {formattedNextDecisionDate}
          </span>
        </span>
      );
    }

    return (
      <span className="tw-text-xs tw-text-iron-400">No upcoming events</span>
    );
  };

  return (
    <button
      type="button"
      className="tw-group tw-w-full tw-cursor-pointer tw-border-0 tw-bg-iron-950 tw-px-2.5 tw-py-2 tw-text-left tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400/70 desktop-hover:hover:tw-bg-iron-900/70"
      onClick={() => setIsOpen(!isOpen)}
      aria-expanded={isOpen}
    >
      <span className="tw-flex tw-w-full tw-items-center tw-gap-2">
        <span
          className={`tw-flex-shrink-0 tw-whitespace-nowrap tw-text-xs tw-font-medium ${
            hasNextDecision ? "tw-text-iron-200" : "tw-text-iron-500"
          }`}
        >
          {hasNextDecision ? "Decision Timeline" : "Announcement history"}
        </span>

        <span className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-justify-end tw-text-xs tw-font-medium">
          {getStatusDisplay()}
        </span>

        <span
          aria-hidden="true"
          className="tw-flex tw-h-6 tw-w-6 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-white/[0.04] tw-p-0 tw-transition-colors tw-duration-200 desktop-hover:hover:tw-bg-white/[0.07]"
        >
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`tw-h-3 tw-w-3 tw-flex-shrink-0 tw-text-iron-400 desktop-hover:group-hover:tw-text-iron-200 ${
              isOpen ? "tw-rotate-180" : ""
            } tw-transition-transform tw-duration-200 tw-ease-out`}
          />
        </span>
      </span>
    </button>
  );
};
