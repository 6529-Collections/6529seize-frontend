import React from "react";
import PrimaryButton from "../../../utils/button/PrimaryButton";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { useWave } from "../../../../hooks/useWave";

interface WaveLeaderboardEmptyStateProps {
  readonly wave: ApiWave;
  readonly onCreateDrop: () => void;
}

export const WaveLeaderboardEmptyState: React.FC<
  WaveLeaderboardEmptyStateProps
> = ({ onCreateDrop, wave }) => {
  const { isMemesWave } = useWave(wave);
  if (isMemesWave) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-py-12 tw-px-4">
        <div className="tw-text-center">
          <svg
            className="tw-w-12 tw-h-12 tw-mx-auto tw-mb-4 tw-text-iron-700"
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
          <div className="tw-text-iron-300 tw-font-medium tw-mb-1">
            No artwork submissions yet
          </div>
          <div className="tw-text-iron-500 tw-text-sm">
            Be the first to submit your artwork to The Memes collection
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="tw-text-center tw-h-full tw-rounded-xl tw-bg-iron-950 tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-8">
      <h3 className="tw-text-xl tw-font-medium tw-mb-2 tw-text-iron-400">
        No drops to show
      </h3>
      <p className="tw-text-iron-500 tw-mb-4">
        Be the first to create a drop in this wave
      </p>
      <PrimaryButton
        loading={false}
        disabled={false}
        onClicked={onCreateDrop}
        padding="tw-px-4 tw-py-2"
      >
        <svg
          className="tw-w-4 tw-h-4 tw-flex-shrink-0 -tw-ml-1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
            clipRule="evenodd"
          />
        </svg>
        <span>Drop</span>
      </PrimaryButton>
    </div>
  );
};
