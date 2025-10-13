import clsx from "clsx";
import { useMemo } from "react";

import { buildLongTermScheduleMetrics } from "./data-builders";
import type { NetworkStats } from "./types";
import styles from "./GrowthPathTrack.module.css";

interface GrowthPathTrackProps {
  readonly milestones: NetworkStats["multiplier"]["milestones"];
}

export function GrowthPathTrack({
  milestones,
}: Readonly<GrowthPathTrackProps>) {
  const metrics = useMemo(
    () => buildLongTermScheduleMetrics(milestones),
    [milestones]
  );

  if (metrics.length === 0) {
    return (
      <div className="tw-flex tw-flex-col tw-gap-1 tw-pt-1">
        <p className="tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-300">
          Growth Path
        </p>
        <p className="tw-m-0 tw-text-[11px] tw-text-iron-400">
          Long-term milestones will publish soon.
        </p>
      </div>
    );
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-1.5 tw-pt-1">
      <p className="tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-300">
        Growth Path
      </p>
      <div className="tw-relative tw-hidden md:tw-block tw-w-full tw-min-h-[48px] tw-px-3 tw-py-2">
        <div
          aria-hidden="true"
          className={clsx(styles.trackLine, "tw-pointer-events-none")}
        />
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={clsx(
              styles.marker,
              "tw-flex tw-flex-col tw-items-center tw-gap-1.5"
            )}
            style={{ left: `${metric.positionPercent}%` }}
            data-position-percent={metric.positionPercent}
          >
            <span className="tw-text-xs tw-font-semibold tw-text-primary-100">
              {metric.value}
            </span>
            <span aria-hidden="true" className={styles.markerDot} />
            {metric.helperText ? (
              <span className="tw-text-[11px] tw-text-iron-300">
                {metric.helperText}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="tw-relative tw-flex md:tw-hidden tw-w-full tw-flex-col tw-items-center tw-gap-2 tw-py-2">
        <div
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-left-1/2 tw-top-3 tw-bottom-3 tw-w-px tw--translate-x-1/2 tw-bg-primary-400/25"
        />
        <div
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-left-1/2 tw-bottom-1 tw-h-6 tw-w-px tw--translate-x-1/2 tw-bg-gradient-to-b tw-from-primary-400/25 tw-to-transparent"
        />
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="tw-flex tw-flex-col tw-items-center tw-gap-1.5"
          >
            <span className="tw-text-xs tw-font-semibold tw-text-primary-100">
              {metric.value}
            </span>
            <span
              aria-hidden="true"
              className="tw-inline-flex tw-h-2 tw-w-2 tw-rounded-full tw-bg-primary-400 tw-shadow-[0_0_6px_rgba(37,99,235,0.45)]"
            />
            {metric.helperText ? (
              <span className="tw-text-[11px] tw-text-iron-300">
                {metric.helperText}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
