import React from "react";

interface WaveWinnersSmallEmptyProps {
  readonly isMultiDecision?: boolean | undefined;
  readonly message?: string | undefined;
  readonly title?: string | undefined;
}

export const WaveWinnersSmallEmpty: React.FC<WaveWinnersSmallEmptyProps> = ({
  isMultiDecision = false,
  message,
  title = "No Winners Yet",
}) => {
  // User-friendly messages focused on outcome state, not technical details.
  const displayMessage =
    message ??
    (isMultiDecision
      ? "No winners have been announced for this wave yet. Check back later!"
      : "This wave ended without any winning submissions");

  return (
    <div className="tw-p-3">
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-8">
        <div className="tw-mt-4 tw-text-base tw-font-semibold tw-text-iron-300">
          {title}
        </div>
        <p className="tw-mb-0 tw-mt-2 tw-text-center tw-text-sm tw-text-iron-400">
          {displayMessage}
        </p>
      </div>
    </div>
  );
};
