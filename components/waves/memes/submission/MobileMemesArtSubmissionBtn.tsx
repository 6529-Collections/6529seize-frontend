import React, { useState } from "react";
import { ApiWave } from "../../../../generated/models/ObjectSerializer";
import MemesArtSubmissionModal from "../MemesArtSubmissionModal";

interface MobileMemesArtSubmissionBtnProps {
  readonly wave: ApiWave;
}

/**
 * Floating button for mobile art submission in the top-right corner
 */
const MobileMemesArtSubmissionBtn: React.FC<
  MobileMemesArtSubmissionBtnProps
> = ({ wave }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="tw-absolute tw-top-4 tw-right-4 tw-z-50 tw-bg-blue-500 tw-text-white tw-rounded-full tw-w-10 tw-h-10 tw-flex tw-items-center tw-justify-center tw-shadow-lg hover:tw-bg-blue-600 tw-transition-colors"
        aria-label="Submit artwork"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="tw-h-5 tw-w-5"
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
    </>
  );
};

export default React.memo(MobileMemesArtSubmissionBtn);
