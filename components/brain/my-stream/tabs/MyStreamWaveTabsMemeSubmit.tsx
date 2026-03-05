"use client";

import React, { useMemo } from "react";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import InfoButton from "@/components/utils/button/InfoButton";
import ClosedButton from "@/components/utils/button/ClosedButton";
import ClockIcon from "@/components/utils/icons/ClockIcon";
import CalendarClosedIcon from "@/components/utils/icons/CalendarClosedIcon";
import LimitIcon from "@/components/utils/icons/LimitIcon";
import PermissionIcon from "@/components/utils/icons/PermissionIcon";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWave, SubmissionStatus } from "@/hooks/useWave";
import { useCountdown } from "@/hooks/useCountdown";

interface MyStreamWaveTabsMemeSubmitProps {
  readonly wave: ApiWave;
  readonly handleMemesSubmit: () => void;
}

const HEADER_ACTION_BUTTON_CLASS =
  "tw-max-w-[11.5rem] tw-whitespace-nowrap lg:tw-max-w-[13.5rem] xl:tw-max-w-none";
const HEADER_ACTION_BUTTON_TEXT_CLASS = "tw-min-w-0 tw-truncate";
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
 * - Coming soon (blue info button with countdown)
 * - Active (green primary button)
 *   - With submission count indicator when limited submissions remaining
 *   - With urgency indicator when submission period is ending soon
 * - Maximum submissions reached (blue info button, disabled)
 * - Not eligible (blue info button, disabled, with permission icon)
 * - Closed (gray disabled button)
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
      <ClosedButton
        title={tooltipText}
        fullWidth={false}
        className={HEADER_ACTION_BUTTON_CLASS}
      >
        <CalendarClosedIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
        <span className={HEADER_ACTION_BUTTON_TEXT_CLASS}>
          <span className="xl:tw-hidden">Closed</span>
          <span className="tw-hidden xl:tw-inline">Submissions Closed</span>
        </span>
      </ClosedButton>
    );
  }

  // Coming soon state - submissions haven't started
  if (isComingSoon) {
    const tooltipText = openingTime
      ? `Submissions open on ${new Date(openingTime).toLocaleString()}`
      : "Submissions will open soon";

    return (
      <InfoButton
        disabled={true}
        title={tooltipText}
        variant="info"
        fullWidth={false}
        className={HEADER_ACTION_BUTTON_CLASS}
      >
        <ClockIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
        <span className={HEADER_ACTION_BUTTON_TEXT_CLASS}>
          <span className="xl:tw-hidden">Opens {countdown}</span>
          <span className="tw-hidden xl:tw-inline">
            Submissions Open {countdown}
          </span>
        </span>
      </InfoButton>
    );
  }

  // Not eligible state - user doesn't have permission to submit
  if (waveInfo.participation.isEligible === false) {
    const tooltipText = "You don't have permission to submit to this wave";

    return (
      <InfoButton
        disabled={true}
        title={tooltipText}
        variant="muted"
        fullWidth={false}
        className={HEADER_ACTION_BUTTON_CLASS}
      >
        <PermissionIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
        <span className={HEADER_ACTION_BUTTON_TEXT_CLASS}>
          <span className="xl:tw-hidden">Not Eligible</span>
          <span className="tw-hidden xl:tw-inline">Not Eligible to Submit</span>
        </span>
      </InfoButton>
    );
  }

  // Maximum submissions reached state
  if (waveInfo.participation.hasReachedLimit) {
    const maxSubmissions = waveInfo.participation.maxSubmissions ?? "?";
    const submissionText =
      maxSubmissions === 1 ? "1 submission" : `${maxSubmissions} submissions`;

    const tooltipText = `You have already submitted the maximum allowed (${submissionText})`;

    return (
      <InfoButton
        disabled={true}
        title={tooltipText}
        variant="muted"
        fullWidth={false}
        className={HEADER_ACTION_BUTTON_CLASS}
      >
        <LimitIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
        <span className={HEADER_ACTION_BUTTON_TEXT_CLASS}>
          <span className="xl:tw-hidden">Limit Reached</span>
          <span className="tw-hidden xl:tw-inline">
            {maxSubmissions === 1
              ? "Submission Limit Reached (1)"
              : `Submission Limit Reached (${maxSubmissions})`}
          </span>
        </span>
      </InfoButton>
    );
  }

  // Check if user has limited remaining submissions
  const hasLimitedRemaining =
    waveInfo.participation.remainingSubmissions !== null &&
    waveInfo.participation.remainingSubmissions <= 3 &&
    waveInfo.participation.remainingSubmissions > 0;

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

  // Format tooltip text based on state
  const tooltipText = canSubmit
    ? hasLimitedRemaining
      ? `You have ${waveInfo.participation.remainingSubmissions} submission${
          waveInfo.participation.remainingSubmissions === 1 ? "" : "s"
        } remaining`
      : isEndingVerySoon
        ? `URGENT: Submissions closing in less than an hour! Ends at ${new Date(endTime).toLocaleString()}`
        : isEndingHighlyUrgent
          ? `Submissions closing in a few hours! Ends at ${new Date(endTime).toLocaleString()}`
          : isEndingSoon
            ? `Submissions closing soon! Ends on ${new Date(endTime).toLocaleString()}`
            : "Submit your art for The Memes"
    : "You cannot submit at this time";
  const { activeLabelFull, activeLabelCompact } = getActiveLabels({
    canSubmit,
    isEndingVerySoon,
    isEndingHighlyUrgent,
    isEndingSoon,
  });
  const showSplitActiveLabels = activeLabelCompact !== activeLabelFull;

  // Active state - submissions are open
  return (
    <PrimaryButton
      loading={false}
      disabled={!canSubmit}
      onClicked={handleMemesSubmit}
      padding="tw-px-2.5 tw-py-2"
      title={tooltipText}
    >
      {isEndingVerySoon && canSubmit ? (
        <ClockIcon className="tw-text-red-500 tw-h-5 tw-w-5 tw-flex-shrink-0 tw-animate-pulse" />
      ) : isEndingHighlyUrgent && canSubmit ? (
        <ClockIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-animate-pulse tw-text-amber-500" />
      ) : isEndingSoon && canSubmit ? (
        <ClockIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-amber-400" />
      ) : (
        <svg
          className="tw-h-5 tw-w-5 tw-flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7.5 12H16.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 7.5V16.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-whitespace-nowrap">
        {showSplitActiveLabels ? (
          <>
            <span className="xl:tw-hidden">{activeLabelCompact}</span>
            <span className="tw-hidden xl:tw-inline">{activeLabelFull}</span>
          </>
        ) : (
          <span>{activeLabelFull}</span>
        )}

        {/* Show appropriate badges based on state */}
        {isEndingVerySoon && canSubmit && (
          <span className="tw-bg-red-600 tw-hidden tw-animate-pulse tw-items-center tw-rounded-full tw-border tw-border-white/30 tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium tw-text-white xl:tw-inline-flex">
            Closing {endingCountdown}!
          </span>
        )}

        {isEndingHighlyUrgent && !isEndingVerySoon && canSubmit && (
          <span className="tw-hidden tw-items-center tw-rounded-full tw-border tw-border-white/30 tw-bg-amber-600 tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium tw-text-white xl:tw-inline-flex">
            Closing {endingCountdown}
          </span>
        )}

        {/* Show remaining submissions badge - only show if not very urgent */}
        {hasLimitedRemaining && !isEndingVerySoon && canSubmit && (
          <span className="tw-hidden tw-items-center tw-rounded-full tw-border tw-border-white/30 tw-bg-primary-600 tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium tw-text-white xl:tw-inline-flex">
            {waveInfo.participation.remainingSubmissions === 1
              ? "Last One!"
              : `${waveInfo.participation.remainingSubmissions} Left`}
          </span>
        )}
      </div>
    </PrimaryButton>
  );
};

export default MyStreamWaveTabsMemeSubmit;
