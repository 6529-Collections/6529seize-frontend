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
        className={`${podiumSurfaceClassName} ${styles.surface} ${styles.height}`}
      >
        <div className="tw-flex tw-w-full tw-items-center tw-justify-between tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.05] tw-pb-3">
          <div className="tw-h-2 tw-w-12 tw-rounded-full tw-bg-iron-800" />
          <div className="tw-h-2 tw-w-5 tw-rounded-full tw-bg-iron-800" />
        </div>
        <div className="tw-flex tw-w-full tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-py-4">
          <div
            className={`${styles.pfpSize} tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-iron-700`}
          />
          <div className="tw-h-3 tw-w-3/4 tw-max-w-28 tw-rounded-full tw-bg-iron-800" />
          <div className="tw-h-2 tw-w-1/2 tw-max-w-20 tw-rounded-full tw-bg-iron-800" />
        </div>
        <div className="tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2">
          <div className="tw-h-8 tw-w-16 tw-rounded-lg tw-bg-iron-800" />
          <div className="tw-h-8 tw-w-16 tw-rounded-lg tw-bg-iron-800" />
        </div>
      </div>
    </div>
  );
};
