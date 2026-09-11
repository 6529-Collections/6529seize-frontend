import React from "react";

interface HorizontalTimelineDotProps {
  readonly isNext: boolean;
  readonly isPast: boolean;
}

/**
 * Renders a dot for the horizontal timeline
 */
export const HorizontalTimelineDot: React.FC<HorizontalTimelineDotProps> = ({
  isNext,
  isPast,
}) => {
  return (
    <div
      className={`tw-size-2 tw-rounded-full ${
        isNext
          ? "tw-bg-primary-400 tw-ring-2 tw-ring-primary-400/20"
          : isPast
            ? "tw-bg-iron-600"
            : "tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950"
      }`}
    ></div>
  );
};
