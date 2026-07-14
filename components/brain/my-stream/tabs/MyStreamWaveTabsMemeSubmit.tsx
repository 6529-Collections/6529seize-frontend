"use client";

import React, { useMemo } from "react";
import {
  CalendarDaysIcon,
  ClockIcon,
  LockClosedIcon,
  NoSymbolIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import WaveHeaderRestrictionButton from "@/components/waves/header/WaveHeaderRestrictionButton";
import MainStageNominationPopover from "./MainStageNominationPopover";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWave, SubmissionStatus } from "@/hooks/useWave";
import { useCountdown } from "@/hooks/useCountdown";

interface MyStreamWaveTabsMemeSubmitProps {
  readonly wave: ApiWave;
  readonly handleMemesSubmit: () => void;
}

const HEADER_ACTION_BUTTON_CLASS =
  "tw-h-8 tw-min-w-8 tw-max-w-[2rem] tw-whitespace-nowrap tw-text-xs sm:tw-min-w-0 sm:tw-max-w-[11.5rem] lg:tw-max-w-[13.5rem] xl:tw-max-w-none";
const HEADER_ACTION_BUTTON_TEXT_CLASS =
  "tw-sr-only tw-min-w-0 tw-truncate sm:tw-not-sr-only sm:tw-inline";
const RESTRICTED_HEADER_BUTTON_CLASS = `tw-w-auto tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-0 tw-text-iron-400 desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200 sm:tw-px-2.5 ${HEADER_ACTION_BUTTON_CLASS}`;
const NOT_ELIGIBLE_BUTTON_CLASS = `tw-group tw-flex tw-w-auto tw-cursor-pointer tw-items-center tw-justify-center tw-gap-x-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-0 tw-text-xs tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-[180ms] tw-ease-out desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500 sm:tw-px-2.5 ${HEADER_ACTION_BUTTON_CLASS}`;
const ACTIVE_LABEL_SUBMIT_MEME = "Submit Meme";

const getActiveLabels = ({
  canSubmit,
  isEndingVerySoon,
  isEndingHighlyUrgent,
  isEndingSoon,
}: {
  canSubmit: boolean;
  isEndingVerySoon: boolean;
  isEndingHighlyUrgent: boolean;
  isEndingSoon: boolean;
}): { activeLabelFull: string; activeLabelCompact: string } => {
  if (!canSubmit) {
    return {
      activeLabelFull: "Submit Work to The Memes",
      activeLabelCompact: "Submit Work",
    };
  }

  if (isEndingVerySoon) {
    return {
      activeLabelFull: ACTIVE_LABEL_SUBMIT_MEME,
      activeLabelCompact: ACTIVE_LABEL_SUBMIT_MEME,
    };
  }

  if (isEndingHighlyUrgent) {
    return {
      activeLabelFull: ACTIVE_LABEL_SUBMIT_MEME,
      activeLabelCompact: ACTIVE_LABEL_SUBMIT_MEME,
    };
  }

  if (isEndingSoon) {
    return {
      activeLabelFull: "Submit Meme (Closes Soon!)",
      activeLabelCompact: ACTIVE_LABEL_SUBMIT_MEME,
    };
  }

  return {
    activeLabelFull: "Submit Work to The Memes",
    activeLabelCompact: "Submit Work",
  };
};

/**
 * Button component for The Memes submissions with multiple states:
 * - Coming soon (restriction details with countdown)
 * - Active (green primary button)
 *   - With submission count indicator when limited submissions remaining
 *   - With urgency indicator when submission period is ending soon
 * - Maximum submissions reached (restriction details)
 * - Not eligible (interactive nomination progress popover)
 * - Closed (restriction details)
 *
 * Uses useWave hook to determine submission status, eligibility,
 * time windows, and submission limits
 */
const MyStreamWaveTabsMemeSubmit: React.FC<MyStreamWaveTabsMemeSubmitProps> = ({
  wave,
  handleMemesSubmit,
}) => {
  // Get wave information including participation status
  const waveInfo = useWave(wave);

  // Call hooks before any conditional returns
  // This ensures hooks are called consistently in the same order
  const targetTime =
    waveInfo?.participation.status === SubmissionStatus.NOT_STARTED
      ? waveInfo?.participation.startTime
      : null;
  const countdown = useCountdown(targetTime);

  // Get end time for ending soon countdown - must be called before any returns
  const endTimeForCountdown = waveInfo?.participation.endTime ?? null;
  const endingCountdown = useCountdown(endTimeForCountdown);

  const canSubmit = useMemo(
    () => waveInfo?.participation.canSubmitNow ?? false,
    [waveInfo?.participation.canSubmitNow]
  );

  // If wave info is still loading, don't render anything yet
  if (!waveInfo) {
    return null;
  }

  // Determine submission status
  const submissionStatus = waveInfo.participation.status;
  const isClosed = submissionStatus === SubmissionStatus.ENDED;
  const isComingSoon = submissionStatus === SubmissionStatus.NOT_STARTED;

  // Get timestamps for display
  const openingTime = waveInfo.participation.startTime;
  const closingTime = waveInfo.participation.endTime;

  // Closed state - submissions have ended
  if (isClosed) {
    const tooltipText = closingTime
      ? `Submissions closed on ${new Date(closingTime).toLocaleString()}`
      : "Submissions are closed";

    return (
      <WaveHeaderRestrictionButton
        label="Submissions Closed"
        reason={tooltipText}
        className={RESTRICTED_HEADER_BUTTON_CLASS}
        data-testid="closed"
        data-full-width="false"
      >
        <CalendarDaysIcon className="tw-size-4 tw-flex-shrink-0" />
        <span className={HEADER_ACTION_BUTTON_TEXT_CLASS}>
          <span className="xl:tw-hidden">Closed</span>
          <span className="tw-hidden xl:tw-inline">Submissions Closed</span>
        </span>
      </WaveHeaderRestrictionButton>
    );
  }

  // Coming soon state - submissions haven't started
  if (isComingSoon) {
    const tooltipText = openingTime
      ? `Submissions open on ${new Date(openingTime).toLocaleString()}`
      : "Submissions will open soon";

    return (
      <WaveHeaderRestrictionButton
        label="Submissions Open Soon"
        reason={tooltipText}
        className={RESTRICTED_HEADER_BUTTON_CLASS}
        data-testid="info"
        data-full-width="false"
      >
        <ClockIcon className="tw-size-4 tw-flex-shrink-0" />
        <span className={HEADER_ACTION_BUTTON_TEXT_CLASS}>
          <span className="xl:tw-hidden">Opens {countdown}</span>
          <span className="tw-hidden xl:tw-inline">
            Submissions Open {countdown}
          </span>
        </span>
      </WaveHeaderRestrictionButton>
    );
  }

  // Not eligible state - user doesn't have permission to submit
  if (waveInfo.participation.isEligible === false) {
    return (
      <MainStageNominationPopover>
        <button
          type="button"
          aria-haspopup="dialog"
          className={NOT_ELIGIBLE_BUTTON_CLASS}
        >
          <LockClosedIcon className="tw-size-4 tw-flex-shrink-0 tw-opacity-70 tw-transition-opacity tw-duration-[180ms] tw-ease-out group-hover:tw-opacity-100" />
          <span className={HEADER_ACTION_BUTTON_TEXT_CLASS}>How to Submit</span>
        </button>
      </MainStageNominationPopover>
    );
  }

  // Maximum submissions reached state
  if (waveInfo.participation.hasReachedLimit) {
    const maxSubmissions = waveInfo.participation.maxSubmissions ?? "?";
    const submissionText =
      maxSubmissions === 1 ? "1 submission" : `${maxSubmissions} submissions`;

    const tooltipText = `You have already submitted the maximum allowed (${submissionText})`;

    return (
      <WaveHeaderRestrictionButton
        label="Submission Limit Reached"
        reason={tooltipText}
        className={RESTRICTED_HEADER_BUTTON_CLASS}
        data-testid="info"
        data-full-width="false"
      >
        <NoSymbolIcon className="tw-size-4 tw-flex-shrink-0" />
        <span className={HEADER_ACTION_BUTTON_TEXT_CLASS}>
          <span className="xl:tw-hidden">Limit Reached</span>
          <span className="tw-hidden xl:tw-inline">
            {maxSubmissions === 1
              ? "Submission Limit Reached (1)"
              : `Submission Limit Reached (${maxSubmissions})`}
          </span>
        </span>
      </WaveHeaderRestrictionButton>
    );
  }

  // Check if user has limited remaining submissions
  const remainingSubmissionCount =
    waveInfo.participation.remainingSubmissions ?? 0;
  const hasLimitedRemaining =
    remainingSubmissionCount <= 3 && remainingSubmissionCount > 0;

  // Define time thresholds for different urgency levels
  const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hour in milliseconds
  const SIX_HOURS_MS = 6 * ONE_HOUR_MS; // 6 hours in milliseconds
  const ONE_DAY_MS = 24 * ONE_HOUR_MS; // 24 hours in milliseconds
  const now = Date.now();

  // Calculate time remaining until submissions end
  const endTime = waveInfo.participation.endTime;
  const timeRemaining = endTime ? endTime - now : null;

  // Check urgency levels based on time remaining
  const isEndingVerySoon =
    waveInfo.participation.isWithinPeriod &&
    timeRemaining !== null &&
    timeRemaining < ONE_HOUR_MS &&
    timeRemaining > 0;

  const isEndingHighlyUrgent =
    waveInfo.participation.isWithinPeriod &&
    timeRemaining !== null &&
    timeRemaining < SIX_HOURS_MS &&
    timeRemaining > 0;

  const isEndingSoon =
    waveInfo.participation.isWithinPeriod &&
    timeRemaining !== null &&
    timeRemaining < ONE_DAY_MS &&
    timeRemaining > 0;

  let tooltipText = "Submit your art for The Memes";
  if (!canSubmit) {
    tooltipText = "You cannot submit at this time";
  } else if (hasLimitedRemaining) {
    tooltipText = `You have ${remainingSubmissionCount} submission${
      remainingSubmissionCount === 1 ? "" : "s"
    } remaining`;
  } else if (isEndingVerySoon) {
    tooltipText = `URGENT: Submissions closing in less than an hour! Ends at ${new Date(endTime).toLocaleString()}`;
  } else if (isEndingHighlyUrgent) {
    tooltipText = `Submissions closing in a few hours! Ends at ${new Date(endTime).toLocaleString()}`;
  } else if (isEndingSoon) {
    tooltipText = `Submissions closing soon! Ends on ${new Date(endTime).toLocaleString()}`;
  }
  const { activeLabelFull, activeLabelCompact } = getActiveLabels({
    canSubmit,
    isEndingVerySoon,
    isEndingHighlyUrgent,
    isEndingSoon,
  });
  const showSplitActiveLabels = activeLabelCompact !== activeLabelFull;

  if (!canSubmit) {
    return (
      <WaveHeaderRestrictionButton
        label={activeLabelFull}
        reason={tooltipText}
        className={RESTRICTED_HEADER_BUTTON_CLASS}
      >
        <LockClosedIcon className="tw-size-4 tw-flex-shrink-0" />
        <span className={HEADER_ACTION_BUTTON_TEXT_CLASS}>
          {activeLabelCompact}
        </span>
      </WaveHeaderRestrictionButton>
    );
  }

  let activeIcon = <PlusIcon className="tw-size-4 tw-flex-shrink-0" />;
  if (isEndingVerySoon) {
    activeIcon = (
      <ClockIcon className="tw-text-red-500 tw-size-4 tw-flex-shrink-0 tw-animate-pulse" />
    );
  } else if (isEndingHighlyUrgent) {
    activeIcon = (
      <ClockIcon className="tw-size-4 tw-flex-shrink-0 tw-animate-pulse tw-text-amber-500" />
    );
  } else if (isEndingSoon) {
    activeIcon = (
      <ClockIcon className="tw-size-4 tw-flex-shrink-0 tw-text-amber-400" />
    );
  }

  // Active state - submissions are open
  return (
    <PrimaryButton
      loading={false}
      disabled={false}
      onClicked={handleMemesSubmit}
      size="sm"
      padding="tw-p-0 sm:tw-px-2.5 sm:tw-py-2"
      title={tooltipText}
      className={HEADER_ACTION_BUTTON_CLASS}
    >
      {activeIcon}
      <div className="tw-sr-only tw-min-w-0 tw-items-center tw-gap-2 tw-whitespace-nowrap sm:tw-not-sr-only sm:tw-flex">
        {showSplitActiveLabels ? (
          <>
            <span className="xl:tw-hidden">{activeLabelCompact}</span>
            <span className="tw-hidden xl:tw-inline">{activeLabelFull}</span>
          </>
        ) : (
          <span>{activeLabelFull}</span>
        )}

        {/* Show appropriate badges based on state */}
        {isEndingVerySoon && (
          <span className="tw-bg-red-600 tw-hidden tw-animate-pulse tw-items-center tw-rounded-full tw-border tw-border-white/30 tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium tw-text-white xl:tw-inline-flex">
            Closing {endingCountdown}!
          </span>
        )}

        {isEndingHighlyUrgent && !isEndingVerySoon && (
          <span className="tw-hidden tw-items-center tw-rounded-full tw-border tw-border-white/30 tw-bg-amber-600 tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium tw-text-white xl:tw-inline-flex">
            Closing {endingCountdown}
          </span>
        )}

        {/* Show remaining submissions badge - only show if not very urgent */}
        {hasLimitedRemaining && !isEndingVerySoon && (
          <span className="tw-hidden tw-items-center tw-rounded-full tw-border tw-border-white/30 tw-bg-primary-600 tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium tw-text-white xl:tw-inline-flex">
            {remainingSubmissionCount === 1
              ? "Last One!"
              : `${remainingSubmissionCount} Left`}
          </span>
        )}
      </div>
    </PrimaryButton>
  );
};

export default MyStreamWaveTabsMemeSubmit;
