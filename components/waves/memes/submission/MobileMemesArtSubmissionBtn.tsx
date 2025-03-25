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
      <div className="lg:tw-hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="tw-absolute tw-top-4 tw-right-4 tw-z-50 tw-text-white desktop-hover:hover:tw-bg-primary-600 desktop-hover:hover:tw-border-primary-600 tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-primary-500 tw-rounded-full tw-bg-primary-500 tw-size-10 tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
          aria-label="Submit Artwork to Memes"
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
      </div>
    </>
  );
};

export default React.memo(MobileMemesArtSubmissionBtn);
