"use client";

import type { QueryStatus } from "@tanstack/react-query";
import type { ApiWave } from "@/generated/models/ApiWave";
import UserPageBrainSidebarWaveItem from "./UserPageBrainSidebarWaveItem";

interface UserPageBrainSidebarMostActiveProps {
  readonly waves: ApiWave[];
  readonly status: QueryStatus;
  readonly error: unknown;
}

export default function UserPageBrainSidebarMostActive({
  waves,
  status,
  error,
}: UserPageBrainSidebarMostActiveProps) {
  const shouldShowLoading = status === "pending";
  const shouldShowWaves =
    (error === null || error === undefined) && waves.length > 0;
  if (!shouldShowLoading && !shouldShowWaves) {
    return null;
  }

  return (
    <section aria-labelledby="brain-most-active-waves-heading">
      <span
        id="brain-most-active-waves-heading"
        className="tw-mb-3 tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500"
      >
        Most Active In
      </span>
      <div className="tw-space-y-2.5">
        {shouldShowLoading ? (
          <div
            className="tw-space-y-2.5"
            aria-label="Loading most active waves"
          >
            {[0, 1, 2].map((key) => (
              <div
                key={key}
                className="tw-flex tw-items-center tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-white/5 tw-p-3 tw-shadow-inner"
              >
                <div className="tw-h-10 tw-w-10 tw-shrink-0 tw-animate-pulse tw-rounded-full tw-bg-white/[0.06]" />
                <div className="tw-min-w-0 tw-flex-1 tw-space-y-1.5">
                  <div className="tw-h-3 tw-w-2/3 tw-animate-pulse tw-rounded tw-bg-white/[0.06]" />
                  <div className="tw-h-2.5 tw-w-1/2 tw-animate-pulse tw-rounded tw-bg-white/[0.05]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          waves.map((wave) => (
            <UserPageBrainSidebarWaveItem key={wave.id} wave={wave} />
          ))
        )}
      </div>
    </section>
  );
}
