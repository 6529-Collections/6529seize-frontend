import React from "react";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

/**
 * Compact row for phases with no end date (e.g. perpetual rank waves), shown
 * in place of a countdown that would otherwise tick towards a far-future
 * fallback timestamp.
 */
export const OpenEndedPhaseRow: React.FC<{
  readonly labelKey:
    | "waves.leaderboard.phase.votingOngoing"
    | "waves.leaderboard.phase.droppingOngoing";
}> = ({ labelKey }) => (
  <div className="tw-px-2">
    <div className="tw-flex tw-flex-col tw-justify-between tw-gap-y-1 sm:tw-flex-row sm:tw-flex-nowrap sm:tw-items-center">
      <span className="tw-text-xs tw-text-iron-400">
        {t(DEFAULT_LOCALE, labelKey)}
      </span>{" "}
      <span className="tw-ml-2 tw-whitespace-nowrap tw-px-1.5 tw-text-xs tw-text-iron-400">
        {t(DEFAULT_LOCALE, "waves.leaderboard.phase.noEndDate")}
      </span>
    </div>
  </div>
);
