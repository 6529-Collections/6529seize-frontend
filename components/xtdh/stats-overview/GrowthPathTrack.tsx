import clsx from "clsx";

import type { MultiplierCycleProgress } from "./types";
import styles from "./GrowthPathTrack.module.css";

interface NextMultiplierProgressProps {
  readonly progress: MultiplierCycleProgress | null;
}

export function GrowthPathTrack({
  progress,
}: Readonly<NextMultiplierProgressProps>) {
  const percentComplete = progress
    ? Math.max(0, Math.min(100, progress.percentComplete))
    : 0;
  const roundedPercent = Math.round(percentComplete);

  return (
    <div className="tw-flex tw-flex-col tw-gap-1.5 tw-pt-1">
      <p className="tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-300">
        Current Progress to Next Multiplier
      </p>
      {progress ? (
        <div className="tw-flex tw-flex-col tw-gap-1">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={roundedPercent}
            className={clsx(
              styles.progressTrack,
              "tw-relative tw-h-1.5 tw-w-full tw-overflow-hidden tw-rounded-full"
            )}
          >
            <div
              className={clsx(styles.progressFill, "tw-absolute tw-inset-y-0 tw-left-0")}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          <p className="tw-m-0 tw-text-[11px] tw-font-semibold tw-text-primary-200">
            {percentComplete >= 100
              ? "Next multiplier unlocked"
              : `${roundedPercent}% complete to next increase`}
          </p>
        </div>
      ) : (
        <p className="tw-m-0 tw-text-[11px] tw-text-iron-400">
          Progress data will publish soon.
        </p>
      )}
    </div>
  );
}
