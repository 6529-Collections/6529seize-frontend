import React from "react";

interface WaveWinnersApprovalErrorProps {
  readonly onRetry: () => void;
}

export const WaveWinnersApprovalError: React.FC<
  WaveWinnersApprovalErrorProps
> = ({ onRetry }) => (
  <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-px-4 tw-py-10 tw-text-center">
    <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-300">
      Unable to load approved drops.
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="tw-rounded-lg tw-border tw-border-iron-600 tw-bg-iron-800 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors hover:tw-border-iron-500 hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
    >
      Try again
    </button>
  </div>
);
