"use client";

import { useId, type FC } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import type { ApiWaveDecisionPause } from "@/generated/models/ApiWaveDecisionPause";
import type { TimeLeft } from "@/helpers/waves/time.utils";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
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
  const locale = useBrowserLocale();
  const statusDescriptionId = useId();
  const hasNextDecision = typeof nextDecisionTime === "number";

  // Extract the status display logic
  const getStatusDisplay = () => {
    if (isPaused && currentPause) {
      return (
        <span
          id={statusDescriptionId}
          className="tw-inline-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-[11px]"
        >
          <span className="tw-flex-shrink-0 tw-whitespace-nowrap tw-rounded-full tw-bg-amber-400/10 tw-px-2 tw-py-1 tw-font-semibold tw-leading-none tw-text-amber-300">
            {t(locale, "waves.leaderboard.timeline.paused")}
          </span>
          <span className="tw-truncate tw-font-medium tw-text-iron-400">
            {hasNextDecision
              ? t(locale, "waves.leaderboard.timeline.nextDecisionAfter", {
                  date: formatDate(locale, nextDecisionTime, {
                    month: "short",
                    day: "numeric",
                  }),
                })
              : t(locale, "waves.leaderboard.timeline.noDecisionScheduled")}
          </span>
        </span>
      );
    }

    if (hasNextDecision) {
      return (
        <CompactTimeCountdown
          timeLeft={timeLeft}
          locale={locale}
          descriptionId={statusDescriptionId}
        />
      );
    }

    return (
      <span
        id={statusDescriptionId}
        className="tw-text-xs tw-text-iron-400"
      >
        {t(locale, "waves.leaderboard.timeline.noUpcomingEvents")}
      </span>
    );
  };

  return (
    <button
      type="button"
      className="tw-group tw-w-full tw-cursor-pointer tw-border-0 tw-bg-iron-950 tw-px-2.5 tw-py-1.5 tw-text-left tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400/70 desktop-hover:hover:tw-bg-iron-900/70"
      onClick={() => setIsOpen(!isOpen)}
      aria-expanded={isOpen}
      aria-label={t(locale, "waves.leaderboard.timeline.toggle")}
      aria-describedby={statusDescriptionId}
    >
      <span className="tw-flex tw-w-full tw-items-center tw-gap-2">
        <span
          className={`tw-flex-shrink-0 tw-whitespace-nowrap tw-text-xs tw-font-medium ${
            hasNextDecision ? "tw-text-iron-200" : "tw-text-iron-500"
          }`}
        >
          {hasNextDecision
            ? t(locale, "waves.leaderboard.timeline.decisionTimeline")
            : t(locale, "waves.leaderboard.timeline.announcementHistory")}
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
