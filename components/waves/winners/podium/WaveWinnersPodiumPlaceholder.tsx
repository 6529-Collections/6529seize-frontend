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
        className={`${styles.pfpOverlap} tw-relative tw-z-10 tw-flex tw-flex-shrink-0 tw-flex-col tw-items-center`}
      >
        <div
          className={`${styles.pfpSize} tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800/80`}
        />
      </div>

      <div
        className={`${podiumSurfaceClassName} ${styles.height} !tw-border-white/[0.025] !tw-from-iron-900/55 !tw-via-iron-900/20 !tw-to-transparent`}
      >
        <div className="tw-flex tw-w-full tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-pb-3 tw-pt-7 sm:tw-gap-3 sm:tw-pb-4 sm:tw-pt-9">
          <div className="tw-h-3 tw-w-3/4 tw-max-w-28 tw-rounded-full tw-bg-iron-800/80" />
          <div className="tw-h-2 tw-w-1/2 tw-max-w-20 tw-rounded-full tw-bg-iron-800/80" />
          <div className="tw-h-3 tw-w-14 tw-rounded-full tw-bg-iron-800/80" />
        </div>
        <div className="tw-flex tw-w-full tw-flex-col tw-items-center tw-gap-2 sm:tw-gap-3">
          <div className="tw-flex tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-1 @[42rem]/podium:tw-flex-row @[42rem]/podium:tw-gap-1.5">
            <div className="tw-h-7 tw-w-14 tw-rounded-lg tw-bg-iron-800/80 sm:tw-h-8 sm:tw-w-16" />
            <div className="tw-h-7 tw-w-14 tw-rounded-lg tw-bg-iron-800/80 sm:tw-h-8 sm:tw-w-16" />
          </div>
        </div>
      </div>
    </div>
  );
};
