"use client";

import React, { useEffect, useState } from "react";
import clsx from "clsx";
import type { ApiWave } from "@/generated/models/ApiWave";
import MemesArtSubmissionModal from "../MemesArtSubmissionModal";
import { SubmissionStatus, useWave } from "@/hooks/useWave";

interface MobileMemesArtSubmissionBtnProps {
  readonly wave: ApiWave;
  readonly isSubmissionLocked?: boolean | undefined;
}

const URGENT_DEADLINE_MS = 6 * 60 * 60 * 1000;
const URGENT_REFRESH_MS = 60_000;

interface MobileMemesArtSubmissionBtnContentProps {
  readonly ariaLabel: string;
  readonly isSubmissionDisabled: boolean;
  readonly isUrgent: boolean;
  readonly wave: ApiWave;
}

const MobileMemesArtSubmissionBtnContent: React.FC<
  MobileMemesArtSubmissionBtnContentProps
> = ({ ariaLabel, isSubmissionDisabled, isUrgent, wave }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:tw-hidden">
      <button
        onClick={() => {
          if (isSubmissionDisabled) return;
          setIsOpen(true);
        }}
        disabled={isSubmissionDisabled}
        className={clsx(
          "tw-absolute tw-right-4 tw-top-4 tw-z-40 tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600",
          isSubmissionDisabled &&
            "tw-cursor-not-allowed tw-border-gray-400 tw-bg-gray-400",
          !isSubmissionDisabled &&
            isUrgent &&
            "tw-animate-pulse tw-border-primary-600 tw-bg-primary-600",
          !isSubmissionDisabled &&
            !isUrgent &&
            "tw-border-primary-500 tw-bg-primary-500 desktop-hover:hover:tw-border-primary-600 desktop-hover:hover:tw-bg-primary-600"
        )}
        aria-label={ariaLabel}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="tw-size-6 tw-flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </button>
      <MemesArtSubmissionModal
        isOpen={isOpen}
        wave={wave}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};

const useCurrentMillis = (enabled: boolean): number | null => {
  const [currentMillis, setCurrentMillis] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const updateCurrentMillis = () => {
      setCurrentMillis(Date.now());
    };

    const timeoutId = globalThis.setTimeout(updateCurrentMillis, 0);
    const intervalId = globalThis.setInterval(
      updateCurrentMillis,
      URGENT_REFRESH_MS
    );

    return () => {
      globalThis.clearTimeout(timeoutId);
      globalThis.clearInterval(intervalId);
    };
  }, [enabled]);

  return currentMillis;
};

/**
 * Floating button for mobile art submission in the top-right corner
 * Supports multiple states:
 * - Active: Green button when submissions are open and user can submit
 * - Disabled: Gray button when user can't submit (submissions ended, max reached, or not eligible)
 * - Urgent: Active button with animation when submission deadline is approaching
 */
const MobileMemesArtSubmissionBtn: React.FC<
  MobileMemesArtSubmissionBtnProps
> = ({ wave, isSubmissionLocked = false }) => {
  const waveInfo = useWave(wave);

  // Determine if user can submit and if it's urgent
  const canSubmit = waveInfo.participation.canSubmitNow === true;
  const isSubmissionDisabled = isSubmissionLocked || !canSubmit;

  const shouldTrackUrgency =
    canSubmit &&
    !isSubmissionLocked &&
    waveInfo.participation.isWithinPeriod === true;
  const currentMillis = useCurrentMillis(shouldTrackUrgency);
  const timeRemaining =
    currentMillis === null
      ? null
      : waveInfo.participation.endTime - currentMillis;
  const isUrgent =
    shouldTrackUrgency &&
    timeRemaining !== null &&
    Number.isFinite(timeRemaining) &&
    timeRemaining > 0 &&
    timeRemaining < URGENT_DEADLINE_MS;

  // Determine appropriate aria-label based on state
  const getAriaLabel = () => {
    if (isSubmissionLocked) return "Submissions are closed";

    const status = waveInfo.participation.status;

    if (status === SubmissionStatus.ENDED) {
      return "Submissions are closed";
    }

    if (!waveInfo.participation.isEligible) {
      return "You are not eligible to submit to this wave";
    }

    if (waveInfo.participation.hasReachedLimit) {
      return "You have reached your maximum submissions";
    }

    return isUrgent
      ? "Submit Work to The Memes - Deadline approaching!"
      : "Submit Work to The Memes";
  };

  return (
    <MobileMemesArtSubmissionBtnContent
      key={isSubmissionLocked ? "locked" : "unlocked"}
      ariaLabel={getAriaLabel()}
      isSubmissionDisabled={isSubmissionDisabled}
      isUrgent={isUrgent}
      wave={wave}
    />
  );
};

export default React.memo(MobileMemesArtSubmissionBtn);
