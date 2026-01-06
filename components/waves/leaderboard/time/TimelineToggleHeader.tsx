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
  const hasNextDecision = !!nextDecisionTime;

  // Extract the status display logic
  const getStatusDisplay = () => {
    if (isPaused && currentPause) {
      return (
        <span className="tw-inline-flex tw-items-center tw-gap-x-2 sm:tw-gap-x-2.5 tw-px-3 tw-py-1.5 tw-rounded-md tw-text-xs tw-bg-gradient-to-r tw-from-iron-800/90 tw-to-iron-700/70 group-hover:tw-from-iron-700/60 group-hover:tw-to-iron-600/40 tw-border tw-border-iron-600/40 group-hover:tw-border-iron-600/30 tw-border-solid tw-shadow-sm group-hover:tw-shadow-none tw-transition-all tw-duration-300 tw-ease-out">
          <span className="tw-font-bold tw-bg-gradient-to-r tw-from-amber-200 tw-via-amber-100 tw-to-amber-200/90 tw-bg-clip-text tw-text-transparent tw-whitespace-nowrap">
            Congrats to last SZN winners!
          </span>
          <span className="tw-text-iron-500">•</span>
          <span className="tw-text-iron-300 tw-font-medium tw-whitespace-nowrap">
            Next SZN starts:{" "}
            {(() => {
              const mintingDate =
                wave && waveData ? waveData.pauses.calculateMintingDate(nextDecisionTime) : null;
              return mintingDate
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

    if (nextDecisionTime) {
      return (
        <span className="tw-text-iron-300 tw-font-medium tw-text-xs">
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
      <span className="tw-text-iron-400 tw-text-xs">No upcoming events</span>
    );
  };

  return (
    <div
      className="tw-@container tw-px-3 tw-py-1.5 tw-bg-iron-800/95 tw-rounded-t-lg tw-border tw-border-solid tw-border-iron-700/50 tw-cursor-pointer desktop-hover:hover:tw-bg-iron-700/80 tw-transition-all tw-duration-300 tw-ease-out tw-group tw-shadow-sm"
      onClick={() => setIsOpen(!isOpen)}>
      <div className="tw-flex tw-items-center tw-gap-2 tw-w-full">

        <span
          className={`tw-text-xs tw-font-semibold tw-whitespace-nowrap tw-flex-shrink-0 ${hasNextDecision ? "tw-text-iron-100" : "tw-text-iron-400"
            }`}>
          {hasNextDecision ? "Decision Timeline" : "Announcement history"}
        </span>


        <div className="tw-flex-1 tw-text-xs tw-font-medium tw-flex tw-justify-end tw-items-center">
          {getStatusDisplay()}
        </div>

        <button
          className="tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-bg-iron-700/50 tw-rounded-md tw-border tw-border-solid tw-border-iron-600/40 desktop-hover:hover:tw-bg-iron-600/60 desktop-hover:hover:tw-border-iron-500/50 tw-transition-all tw-duration-300 tw-ease-out tw-flex-shrink-0"
          aria-label={isOpen ? "Collapse" : "Expand"}>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`tw-w-4 tw-h-4 tw-text-iron-200 desktop-hover:group-hover:tw-text-iron-100 tw-flex-shrink-0 ${isOpen ? "tw-rotate-180" : ""
              } tw-transition-all tw-duration-300 tw-ease-in-out`}
          />
        </button>
      </div>
    </div>
  );
};
