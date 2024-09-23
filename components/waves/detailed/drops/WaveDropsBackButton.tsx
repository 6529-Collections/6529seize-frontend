import React from "react";

interface WaveDropsBackButtonProps {
  readonly onBackToList: () => void;
}

export const WaveDropsBackButton: React.FC<WaveDropsBackButtonProps> = ({
  onBackToList,
}) => {
  return (
    <div className="tw-px-4 tw-py-2">
      <button
        onClick={onBackToList}
        type="button"
        aria-label="Back"
        className="tw-px-2 -tw-mr-2 tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-300 tw-bg-transparent hover:tw-text-iron-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="tw-flex-shrink-0 tw-size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};
