import React from "react";
import { podiumPositionStyles, podiumSurfaceClassName } from "./podiumStyles";

interface WaveWinnersPodiumPlaceholderProps {
  readonly position: "first" | "second" | "third";
  readonly loading?: boolean;
}

export const WaveWinnersPodiumPlaceholder: React.FC<
  WaveWinnersPodiumPlaceholderProps
> = ({ position, loading = false }) => {
  const styles = podiumPositionStyles[position];

  return (
    <div
      aria-hidden="true"
      className={`tw-flex tw-h-full tw-min-w-0 tw-flex-col tw-items-center ${loading ? "motion-safe:tw-animate-pulse" : ""}`}
    >
      <div
        className={`tw-relative tw-z-10 -tw-mb-4 tw-flex-shrink-0 tw-rounded-xl tw-bg-iron-900 tw-ring-1 tw-ring-iron-700 ${styles.pfpSize}`}
      />
      <div
        className={`${podiumSurfaceClassName} ${styles.height} tw-justify-center tw-gap-2`}
      >
        <div className="tw-h-3 tw-w-3/4 tw-max-w-24 tw-rounded-md tw-bg-iron-800" />
        <div className="tw-h-3 tw-w-2/3 tw-max-w-20 tw-rounded-md tw-bg-iron-800" />
        <div className="tw-h-3 tw-w-1/2 tw-max-w-16 tw-rounded-md tw-bg-iron-800" />
      </div>
    </div>
  );
};
