"use client";

import type { FC } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import type { ApiWaveDecisionPause } from "@/generated/models/ApiWaveDecisionPause";
import { useWave } from "@/hooks/useWave";
import type { ApiWave } from "@/generated/models/ApiWave";

interface TimelineToggleHeaderProps {
  readonly isOpen: boolean;
  readonly setIsOpen: (isOpen: boolean) => void;
  readonly nextDecisionTime: number | null;
  readonly isPaused?: boolean | undefined;
  readonly currentPause?: ApiWaveDecisionPause | null | undefined;
  readonly wave?: ApiWave | undefined;
}

/**
 * Renders the header for the timeline with toggle functionality
 */
export const TimelineToggleHeader: FC<TimelineToggleHeaderProps> = ({
  isOpen,
  setIsOpen,
  nextDecisionTime,
  isPaused = false,
  currentPause,
  wave,
}) => {
  const waveData = useWave(wave);
  const hasNextDecision = typeof nextDecisionTime === "number";

  // Extract the status display logic
  const getStatusDisplay = () => {
    if (isPaused && currentPause) {
      return (
        <span className="tw-inline-flex tw-items-center tw-gap-x-2 tw-rounded-md tw-border tw-border-solid tw-border-iron-600/40 tw-bg-gradient-to-r tw-from-iron-800/90 tw-to-iron-700/70 tw-px-3 tw-py-1.5 tw-text-xs tw-shadow-sm tw-transition-all tw-duration-300 tw-ease-out group-hover:tw-border-iron-600/30 group-hover:tw-from-iron-700/60 group-hover:tw-to-iron-600/40 group-hover:tw-shadow-none sm:tw-gap-x-2.5">
          <span className="tw-whitespace-nowrap tw-bg-gradient-to-r tw-from-amber-200 tw-via-amber-100 tw-to-amber-200/90 tw-bg-clip-text tw-font-bold tw-text-transparent">
            Decisions paused
          </span>
          <span className="tw-text-iron-500">•</span>
          <span className="tw-whitespace-nowrap tw-font-medium tw-text-iron-300">
            Next decision after{" "}
            {(() => {
              const mintingDate =
                waveData.pauses.calculateMintingDate(nextDecisionTime);
              return typeof mintingDate === "number"
                ? new Date(mintingDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : new Date(currentPause.end_time).toLocaleDateString(
                    undefined,
                    {
                      month: "short",
                      day: "numeric",
                    }
                  );
            })()}
          </span>
        </span>
      );
    }

    if (hasNextDecision) {
      return (
        <span className="tw-text-xs tw-font-medium tw-text-iron-300">
          {new Date(nextDecisionTime).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      );
    }

    return (
      <span className="tw-text-xs tw-text-iron-400">No upcoming events</span>
    );
  };

  return (
    <div
      className="tw-group tw-cursor-pointer tw-rounded-t-lg tw-border tw-border-solid tw-border-iron-700/50 tw-bg-iron-800/95 tw-px-3 tw-py-1.5 tw-shadow-sm tw-transition-all tw-duration-300 tw-ease-out tw-@container desktop-hover:hover:tw-bg-iron-700/80"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="tw-flex tw-w-full tw-items-center tw-gap-2">
        <span
          className={`tw-flex-shrink-0 tw-whitespace-nowrap tw-text-xs tw-font-semibold ${
            hasNextDecision ? "tw-text-iron-100" : "tw-text-iron-400"
          }`}
        >
          {hasNextDecision ? "Decision Timeline" : "Announcement history"}
        </span>

        <div className="tw-flex tw-flex-1 tw-items-center tw-justify-end tw-text-xs tw-font-medium">
          {getStatusDisplay()}
        </div>

        <button
          className="tw-flex tw-h-6 tw-w-6 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-iron-600/40 tw-bg-iron-700/50 tw-transition-all tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-iron-500/50 desktop-hover:hover:tw-bg-iron-600/60"
          aria-label={isOpen ? "Collapse" : "Expand"}
        >
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-200 desktop-hover:group-hover:tw-text-iron-100 ${
              isOpen ? "tw-rotate-180" : ""
            } tw-transition-all tw-duration-300 tw-ease-in-out`}
          />
        </button>
      </div>
    </div>
  );
};
