"use client";

import type { FC } from "react";

type WaveLeaderboardRightSidebarActivityLogDropProps = {
  readonly onDropClick: () => void;
};

export const WaveLeaderboardRightSidebarActivityLogDrop: FC<
  WaveLeaderboardRightSidebarActivityLogDropProps
> = ({ onDropClick }) => {
  const handleClick = () => {
    onDropClick();
  };

  return (
    <button
      onClick={handleClick}
      title="View drop in chat"
      className="tw-flex tw-items-center tw-gap-1.5 tw-border-none tw-bg-transparent tw-text-iron-400 tw-transition-colors tw-duration-200 hover:tw-text-iron-300"
    >
      <svg
        className="tw-h-4 tw-w-4"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};
