import React from "react";

export const WaveWinnersEmpty: React.FC = () => {
  return (
    <div className="tw-space-y-2 tw-mt-4 tw-pb-4 tw-max-h-[calc(100vh-200px)] tw-pr-2 tw-overflow-y-auto tw-scrollbar-none">
      <div className="tw-p-6 tw-text-center tw-bg-iron-900 tw-rounded-lg tw-border tw-border-iron-800">
        <div className="tw-h-14 tw-w-14 tw-mx-auto tw-rounded-xl tw-flex tw-items-center tw-justify-center tw-bg-iron-800/80 tw-mb-4">
          <svg
            className="tw-mx-auto tw-flex-shrink-0 tw-h-7 tw-w-7 tw-text-iron-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 576 512"
          >
            <path
              fill="currentColor"
              d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0z"
            />
          </svg>
        </div>
        <p className="tw-text-lg tw-font-semibold tw-text-iron-300">
          No Winners Yet
        </p>
        <p className="tw-text-sm tw-text-iron-400 tw-mt-2">
          No winners have been announced for this wave yet. Check back later!
        </p>
      </div>
    </div>
  );
};