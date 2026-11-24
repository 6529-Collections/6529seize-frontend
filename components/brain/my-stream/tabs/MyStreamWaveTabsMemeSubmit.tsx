"use client";

import React, { useMemo } from "react";
import {
  ClockIcon,
  LockClosedIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/utils/button/Button";
import {
  COMPACT_ACTION_ICON_CLASS,
  COMPACT_ACTION_ICON_STROKE_WIDTH,
  COMPACT_ACTION_TOUCH_TARGET_CLASS,
} from "@/components/utils/button/compactActionButtonStyles";
import WaveHeaderRestrictionButton, {
  WAVE_HEADER_RESTRICTION_BUTTON_CLASS,
} from "@/components/waves/header/WaveHeaderRestrictionButton";
import MainStageNominationPopover from "./MainStageNominationPopover";
import { COMPACT_WAVE_ACTION_CLASSES } from "./CompactWaveActions";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWave, SubmissionStatus } from "@/hooks/useWave";
import { useCountdown } from "@/hooks/useCountdown";
import { useDisplayTimeZone } from "@/hooks/useDisplayTimeZone";
import { formatSubmissionWindowTime } from "../waveDropAction.helpers";
import type { WaveSubmissionHelpAction } from "@/components/waves/header/WaveSubmissionHelpDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";

interface MyStreamWaveTabsMemeSubmitProps {
  readonly wave: ApiWave;
  readonly handleMemesSubmit: () => void;
  readonly iconOnly?: boolean;
  readonly phoneMenu?: boolean | undefined;
  readonly onShowSubmissionHelp?:
    | ((action: WaveSubmissionHelpAction) => void)
    | undefined;
}

const HEADER_ACTION_BUTTON_CLASS = `${COMPACT_ACTION_TOUCH_TARGET_CLASS} tw-h-8 tw-min-w-8 tw-max-w-[2rem] tw-whitespace-nowrap tw-text-xs sm:tw-min-w-0 sm:tw-max-w-[11.5rem] lg:tw-max-w-[13.5rem] xl:tw-max-w-none`;
const HEADER_ACTION_BUTTON_TEXT_CLASS =
  "tw-sr-only tw-min-w-0 tw-truncate sm:tw-not-sr-only sm:tw-inline";
const NOT_ELIGIBLE_BUTTON_CLASS =
  "tw-group tw-flex tw-cursor-help tw-items-center tw-justify-center tw-gap-x-1.5 tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-medium tw-text-iron-300 tw-transition-colors tw-duration-[180ms] tw-ease-out desktop-hover:hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";
const ACTIVE_LABEL_SUBMIT_MEME = "waves.dropEligibility.submitMeme";
const HOW_TO_SUBMIT_LABEL_KEY = "waves.dropEligibility.howToSubmit";

const getActiveLabelKeys = ({
  canSubmit,
  isEndingVerySoon,
  isEndingHighlyUrgent,
  isEndingSoon,
}: {
  canSubmit: boolean;
  isEndingVerySoon: boolean;
  isEndingHighlyUrgent: boolean;
  isEndingSoon: boolean;
}): { activeLabelFull: MessageKey; activeLabelCompact: MessageKey } => {
  if (!canSubmit) {
    return {
      activeLabelFull: "waves.dropEligibility.submitWorkToMemes",
      activeLabelCompact: "waves.dropEligibility.submitWork",
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
      activeLabelFull: "waves.dropEligibility.submitMemeClosingSoon",
      activeLabelCompact: ACTIVE_LABEL_SUBMIT_MEME,
    };
  }

  return {
    activeLabelFull: "waves.dropEligibility.submitWorkToMemes",
    activeLabelCompact: "waves.dropEligibility.submitWork",
  };
};

/**
 * Button component for The Memes submissions with multiple states:
 * - Coming soon (restriction details with opening time)
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
  iconOnly = false,
  phoneMenu = false,
  onShowSubmissionHelp,
}) => {
  // Get wave information including participation status
  const waveInfo = useWave(wave);
  const zone = useDisplayTimeZone();
  const locale = useBrowserLocale();

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

  const restrictedClass = phoneMenu
    ? `${COMPACT_WAVE_ACTION_CLASSES} !tw-justify-start tw-text-iron-300`
    : WAVE_HEADER_RESTRICTION_BUTTON_CLASS;

  const renderRestriction = (
    label: string,
    reason: string,
    testId?: string
  ) => {
    if (phoneMenu && onShowSubmissionHelp) {
      return (
        <button
          type="button"
          className={restrictedClass}
          onClick={() =>
            onShowSubmissionHelp({ label, restrictionMessage: reason })
          }
        >
          <LockClosedIcon className="tw-size-4 tw-flex-shrink-0" />
          <span>{t(locale, HOW_TO_SUBMIT_LABEL_KEY)}</span>
        </button>
      );
    }
    return (
      <WaveHeaderRestrictionButton
        label={label}
        reason={reason}
        className={restrictedClass}
        data-testid={testId}
        data-full-width="false"
      >
        <LockClosedIcon className="tw-size-4 tw-flex-shrink-0" />
        {phoneMenu && <span>{label}</span>}
      </WaveHeaderRestrictionButton>
    );
  };

  // Closed state - submissions have ended
  if (isClosed) {
    const tooltipText = closingTime
      ? t(locale, "waves.dropEligibility.closedAt", {
          date: formatSubmissionWindowTime(closingTime, zone),
        })
      : t(locale, "waves.dropEligibility.closedReason");

    return renderRestriction(
      t(locale, "waves.dropEligibility.closed"),
      tooltipText,
      "closed"
    );
  }

  // Coming soon state - submissions haven't started
  if (isComingSoon) {
    const tooltipText = openingTime
      ? t(locale, "waves.dropEligibility.opensAt", {
          date: formatSubmissionWindowTime(openingTime, zone),
        })
      : t(locale, "waves.dropEligibility.opensSoonReason");

    return renderRestriction(
      t(locale, "waves.dropEligibility.openSoon"),
      tooltipText,
      "info"
    );
  }

  // Not eligible state - user doesn't have permission to submit
  if (waveInfo.participation.isEligible === false) {
    if (phoneMenu && onShowSubmissionHelp) {
      return (
        <button
          type="button"
          className={restrictedClass}
          onClick={() =>
            onShowSubmissionHelp({
              label: t(locale, HOW_TO_SUBMIT_LABEL_KEY),
              restrictionKind: "memes-nomination",
              restrictionMessage: null,
            })
          }
        >
          <LockClosedIcon className="tw-size-4 tw-flex-shrink-0" />
          <span>{t(locale, HOW_TO_SUBMIT_LABEL_KEY)}</span>
        </button>
      );
    }
    return (
      <MainStageNominationPopover>
        <button
          type="button"
          aria-haspopup="dialog"
          className={`${NOT_ELIGIBLE_BUTTON_CLASS} ${
            iconOnly
              ? `${COMPACT_ACTION_TOUCH_TARGET_CLASS} tw-size-8 tw-min-w-8`
              : `tw-w-auto sm:tw-px-2.5 ${HEADER_ACTION_BUTTON_CLASS}`
          }`}
        >
          <LockClosedIcon
            className={COMPACT_ACTION_ICON_CLASS}
            strokeWidth={COMPACT_ACTION_ICON_STROKE_WIDTH}
          />
          <span
            className={
              iconOnly
                ? "tw-sr-only"
                : `${HEADER_ACTION_BUTTON_TEXT_CLASS} tw-border-x-0 tw-border-b tw-border-t-0 tw-border-dashed tw-border-iron-600/70 tw-pb-px tw-transition-colors group-hover:tw-border-iron-400/80`
            }
          >
            {t(locale, HOW_TO_SUBMIT_LABEL_KEY)}
          </span>
        </button>
      </MainStageNominationPopover>
    );
  }

  // Maximum submissions reached state
  if (waveInfo.participation.hasReachedLimit) {
    const maxSubmissions = waveInfo.participation.maxSubmissions ?? "?";
    const tooltipText = t(
      locale,
      maxSubmissions === 1
        ? "waves.dropEligibility.limitOneReason"
        : "waves.dropEligibility.limitManyReason",
      {
        count:
          typeof maxSubmissions === "number"
            ? formatInteger(locale, maxSubmissions)
            : maxSubmissions,
      }
    );

    return renderRestriction(
      t(locale, "waves.dropEligibility.limitReached"),
      tooltipText,
      "info"
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
    tooltipText = t(locale, "waves.dropEligibility.unavailableReason");
  } else if (hasLimitedRemaining) {
    tooltipText = `You have ${remainingSubmissionCount} submission${
      remainingSubmissionCount === 1 ? "" : "s"
    } remaining`;
  } else if (isEndingVerySoon) {
    tooltipText = `URGENT: Submissions closing in less than an hour! Ends at ${formatSubmissionWindowTime(endTime, zone)}`;
  } else if (isEndingHighlyUrgent) {
    tooltipText = `Submissions closing in a few hours! Ends at ${formatSubmissionWindowTime(endTime, zone)}`;
  } else if (isEndingSoon) {
    tooltipText = `Submissions closing soon! Ends on ${formatSubmissionWindowTime(endTime, zone)}`;
  }
  const activeLabelKeys = getActiveLabelKeys({
    canSubmit,
    isEndingVerySoon,
    isEndingHighlyUrgent,
    isEndingSoon,
  });
  const activeLabelFull = t(locale, activeLabelKeys.activeLabelFull);
  const activeLabelCompact = t(locale, activeLabelKeys.activeLabelCompact);
  const showSplitActiveLabels = activeLabelCompact !== activeLabelFull;

  if (!canSubmit) {
    return renderRestriction(
      t(locale, "waves.dropEligibility.unavailable"),
      tooltipText
    );
  }

  let activeIcon = (
    <PlusIcon className="tw-size-4 tw-flex-shrink-0" strokeWidth={2} />
  );
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

  if (phoneMenu) {
    return (
      <button
        type="button"
        onClick={handleMemesSubmit}
        title={tooltipText}
        className={`${COMPACT_WAVE_ACTION_CLASSES} tw-text-iron-300`}
      >
        {activeIcon}
        <span>{activeLabelFull}</span>
        {hasLimitedRemaining && (
          <span className="tw-text-iron-400">
            {formatInteger(locale, remainingSubmissionCount)}
          </span>
        )}
      </button>
    );
  }

  // Active state - submissions are open
  return (
    <Button
      onClick={handleMemesSubmit}
      variant="primary"
      size={null}
      title={tooltipText}
      className={
        iconOnly
          ? `${COMPACT_ACTION_TOUCH_TARGET_CLASS} tw-size-8 tw-p-0`
          : `${HEADER_ACTION_BUTTON_CLASS} tw-px-0 sm:tw-px-2.5`
      }
    >
      {activeIcon}
      <div
        className={
          iconOnly
            ? "tw-sr-only"
            : "tw-sr-only tw-min-w-0 tw-items-center tw-gap-2 tw-whitespace-nowrap sm:tw-not-sr-only sm:tw-flex"
        }
      >
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
    </Button>
  );
};

export default MyStreamWaveTabsMemeSubmit;
