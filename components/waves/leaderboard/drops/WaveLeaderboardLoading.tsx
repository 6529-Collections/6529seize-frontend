import React from "react";

export const WaveLeaderboardLoading: React.FC = () => {
  return (
    <div className="tw-w-full tw-py-8">
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3">
        <div className="tw-animate-spin">
          <svg
            className="tw-w-8 tw-h-8 tw-text-iron-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="tw-opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="tw-opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        <div className="tw-text-iron-500 tw-text-sm">Loading drops...</div>
      </div>
    </div>
  );
};