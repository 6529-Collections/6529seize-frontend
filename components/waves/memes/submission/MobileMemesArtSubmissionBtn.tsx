import React, { useMemo, useState } from "react";
import { ApiWave } from "../../../../generated/models/ObjectSerializer";
import MemesArtSubmissionModal from "../MemesArtSubmissionModal";
import { SubmissionStatus, useWave } from "../../../../hooks/useWave";

interface MobileMemesArtSubmissionBtnProps {
  readonly wave: ApiWave;
}

/**
 * Floating button for mobile art submission in the top-right corner
 * Supports multiple states:
 * - Active: Green button when submissions are open and user can submit
 * - Disabled: Gray button when user can't submit (submissions ended, max reached, or not eligible)
 * - Urgent: Active button with animation when submission deadline is approaching
 */
const MobileMemesArtSubmissionBtn: React.FC<
  MobileMemesArtSubmissionBtnProps
> = ({ wave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const waveInfo = useWave(wave);

  // Determine if user can submit and if it's urgent
  const canSubmit = useMemo(() => {
    if (!waveInfo) return false;
    return waveInfo.participation.canSubmitNow === true;
  }, [waveInfo]);

  // Check if submission deadline is approaching (< 6 hours)
  const isUrgent = useMemo(() => {
    if (!waveInfo) return false;
    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
    const now = Date.now();
    const endTime = waveInfo.participation.endTime;
    return (
      canSubmit &&
      waveInfo.participation.isWithinPeriod &&
      endTime &&
      endTime - now < SIX_HOURS_MS &&
      endTime - now > 0
    );
  }, [waveInfo, canSubmit]);

  // Determine appropriate aria-label based on state
  const getAriaLabel = () => {
    if (!waveInfo) return "Submit Artwork to Memes";

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
      ? "Submit Artwork to Memes - Deadline approaching!"
      : "Submit Artwork to Memes";
  };

  return (
    <div className="lg:tw-hidden">
      <button
        onClick={() => setIsOpen(true)}
        disabled={!canSubmit}
        className={`tw-absolute tw-top-4 tw-right-4 tw-z-50 tw-text-white tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-rounded-full tw-size-10 tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out ${
          !canSubmit
            ? "tw-bg-gray-400 tw-border-gray-400 tw-cursor-not-allowed"
            : isUrgent
            ? "tw-bg-primary-600 tw-border-primary-600 tw-animate-pulse"
            : "tw-bg-primary-500 tw-border-primary-500 desktop-hover:hover:tw-bg-primary-600 desktop-hover:hover:tw-border-primary-600"
        }`}
        aria-label={getAriaLabel()}
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

export default React.memo(MobileMemesArtSubmissionBtn);
