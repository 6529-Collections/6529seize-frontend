import React from "react";

interface WaveLeaderboardToggleButtonProps {
  readonly isSidebarOpen: boolean;
  readonly onToggle: () => void;
  readonly isCapacitor: boolean;
}

export const WaveLeaderboardToggleButton: React.FC<WaveLeaderboardToggleButtonProps> = ({
  isSidebarOpen,
  onToggle,
  isCapacitor,
}) => {
  return (
    <button
      onClick={onToggle}
      className={`lg:tw-hidden tw-fixed tw-right-0 tw-border-0 tw-z-[100] tw-text-iron-500 desktop-hover:hover:tw-text-primary-400 tw-transition-all tw-duration-300 tw-ease-in-out tw-bg-iron-700 tw-rounded-r-none tw-rounded-l-lg tw-size-8 tw-flex tw-items-center tw-justify-center tw-shadow-lg desktop-hover:hover:tw-shadow-primary-400/20 ${
        isCapacitor ? "tw-top-[10.5rem]" : "tw-top-[6.25rem]"
      }`}
    >
      {isSidebarOpen ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
          className="tw-w-5 tw-h-5 tw-text-iron-300 tw-flex-shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      ) : (
        <svg
          className="tw-w-5 tw-h-5 tw-text-iron-300 tw-flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      )}
    </button>
  );
};