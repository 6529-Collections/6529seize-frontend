import React from "react";

export const WaveWinnersRoundEmpty: React.FC = () => {
  return (
    <div className="tw-space-y-4 tw-bg-black tw-rounded-b-xl tw-border-t tw-border-iron-800 tw-p-8">
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-center tw-py-8">
        <div className="tw-h-16 tw-w-16 tw-mx-auto tw-rounded-xl tw-flex tw-items-center tw-justify-center tw-bg-iron-800/40 tw-mb-4">
          <svg
            className="tw-mx-auto tw-flex-shrink-0 tw-h-8 tw-w-8 tw-text-iron-400"
            aria-hidden="true"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        </div>
        <p className="tw-text-lg tw-font-semibold tw-text-iron-300">
          No Winners in This Round
        </p>
        <p className="tw-text-sm tw-text-iron-400 tw-mt-2 tw-max-w-md">
          There were no winners selected for this round. Winners may be announced in other rounds or future announcements.
        </p>
      </div>
    </div>
  );
};