import React from "react";

interface DecisionTimelineMarkerProps {
  readonly isNext: boolean;
}

/**
 * Displays a marker for a decision point in the timeline
 */
export const DecisionTimelineMarker: React.FC<DecisionTimelineMarkerProps> = ({
  isNext,
}) => {
  return (
    <div
      className={`tw-absolute tw-left-0 tw-ml-[1px] tw-top-1 tw-transform -tw-translate-x-1/2 tw-flex tw-items-center tw-justify-center ${
        isNext ? "tw-w-4 tw-h-4" : "tw-w-3 tw-h-3"
      }`}
    >
      {isNext && (
        <span className="tw-animate-ping tw-absolute tw-inline-flex tw-h-full tw-w-full tw-rounded-full tw-bg-primary-400/40"></span>
      )}
      <span
        className={`tw-relative tw-inline-flex tw-rounded-full ${
          isNext
            ? "tw-w-4 tw-h-4 tw-bg-primary-400"
            : "tw-w-3 tw-h-3 tw-border tw-border-solid tw-border-white/20 tw-bg-iron-700"
        }`}
      ></span>
    </div>
  );
};