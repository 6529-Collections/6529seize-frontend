import React from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWave } from "@/hooks/useWave";
import { useWaveTimers } from "@/hooks/useWaveTimers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
interface CompactDroppingPhaseCardProps {
  readonly wave: ApiWave;
}

/**
 * Compact card component for dropping phase - used in multi-decision waves
 * Simplified as descriptive text with minimal styling
 */
export const CompactDroppingPhaseCard: React.FC<
  CompactDroppingPhaseCardProps
> = ({ wave }) => {
  const {
    participation: { isCompleted, isUpcoming, timeLeft },
  } = useWaveTimers(wave);
  const {
    participation: { startTime, endTime },
  } = useWave(wave);

  // Open-ended submissions (e.g. perpetual rank waves) have no end to count
  // down to.
  const hasNoEnd = wave.participation?.period?.max == null;

  if (hasNoEnd && !isUpcoming) {
    return (
      <div className="tw-px-2">
        <div className="tw-flex tw-flex-col tw-justify-between tw-gap-y-1 sm:tw-flex-row sm:tw-flex-nowrap sm:tw-items-center">
          <span className="tw-text-xs tw-text-iron-400">
            {t(DEFAULT_LOCALE, "waves.leaderboard.phase.droppingOngoing")}
          </span>{" "}
          <span className="tw-ml-2 tw-whitespace-nowrap tw-px-1.5 tw-text-xs tw-text-iron-400">
            {t(DEFAULT_LOCALE, "waves.leaderboard.phase.noEndDate")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-px-2">
      {!isCompleted ? (
        <div className="tw-flex tw-flex-col tw-justify-between tw-gap-y-1 sm:tw-flex-row sm:tw-flex-nowrap sm:tw-items-center">
          <span className="tw-text-xs tw-text-iron-400">
            {isUpcoming ? "Dropping starts in" : "Dropping ends in"}
          </span>{" "}
          <span>
            <span className="tw-ml-1 tw-font-mono tw-text-xs tw-tracking-tight tw-text-iron-300">
              {timeLeft.days > 0 && `${timeLeft.days}d `}
              {timeLeft.hours}h {timeLeft.minutes}m
            </span>
            <span className="tw-ml-2 tw-whitespace-nowrap tw-px-1.5 tw-text-xs tw-text-iron-400">
              {isUpcoming
                ? new Date(startTime).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : new Date(endTime).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
            </span>
          </span>
        </div>
      ) : (
        <div className="tw-flex tw-flex-nowrap tw-items-center tw-justify-between">
          <div className="tw-flex-1">
            <span className="tw-font-normal">
              <span className="tw-text-xs tw-text-iron-400">
                Dropping complete
              </span>
            </span>
          </div>

          <span className="tw-ml-2 tw-whitespace-nowrap tw-px-1.5 tw-text-xs tw-text-iron-400">
            {new Date(endTime).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  );
};
