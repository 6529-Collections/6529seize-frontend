import React from "react";

export const WaveLeaderboardMemesEmptyState: React.FC = () => {
  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-px-4 tw-py-12">
      <div className="tw-text-center">
        <svg
          className="tw-mx-auto tw-mb-4 tw-size-10 tw-flex-shrink-0 tw-text-iron-700 sm:tw-size-12"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.5 21C3.67157 21 3 20.3284 3 19.5V4.5C3 3.67157 3.67157 3 4.5 3H19.5C20.3284 3 21 3.67157 21 4.5V19.5C21 20.3284 20.3284 21 19.5 21H4.5Z"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 16.5L8.25 11.25C8.66421 10.8358 9.33579 10.8358 9.75 11.25L15 16.5"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14.25 15.75L15.75 14.25C16.1642 13.8358 16.8358 13.8358 17.25 14.25L21 18"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="tw-mb-1 tw-text-base tw-font-medium tw-text-iron-300">
          No artwork submissions yet
        </div>
        <div className="tw-text-sm tw-text-iron-500">
          Be the first to submit your artwork to The Memes collection
        </div>
      </div>
    </div>
  );
};
