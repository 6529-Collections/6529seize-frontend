import React from "react";

interface WaveWinnersSmallEmptyProps {
  readonly isMultiDecision?: boolean;
}

export const WaveWinnersSmallEmpty: React.FC<WaveWinnersSmallEmptyProps> = ({
  isMultiDecision = false,
}) => {
  // Different messages based on wave type
  const title = isMultiDecision
    ? "No Decision Points Available"
    : "No Winners to Display";
  
  const message = isMultiDecision
    ? "There are no past decision points to display"
    : "This wave ended without any submissions";

  return (
    <div className="tw-p-3">
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-8">
        <div className="tw-mt-4 tw-text-base tw-font-semibold tw-text-iron-300">
          {title}
        </div>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-400">
          {message}
        </p>
      </div>
    </div>
  );
};