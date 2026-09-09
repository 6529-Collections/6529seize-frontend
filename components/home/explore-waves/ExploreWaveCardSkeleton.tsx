"use client";

import type { ExploreWaveCardVariant } from "./ExploreWaveCard";

export function ExploreWaveCardSkeleton({
  variant = "default",
}: {
  readonly variant?: ExploreWaveCardVariant | undefined;
}) {
  if (variant === "discover") {
    return (
      <div className="tw-relative tw-flex tw-h-full tw-min-h-[22rem] tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950">
        <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-b tw-from-iron-800/60 tw-to-iron-950 tw-to-60%" />
        <div className="tw-relative tw-flex tw-flex-1 tw-flex-col tw-px-5 tw-pb-5 tw-pt-40">
          <div className="tw-h-6 tw-w-3/4 tw-animate-pulse tw-rounded-md tw-bg-iron-800 motion-reduce:tw-animate-none" />
          <div className="tw-mt-3 tw-min-h-10 tw-space-y-2">
            <div className="tw-h-3 tw-w-full tw-animate-pulse tw-rounded-md tw-bg-iron-800/60 motion-reduce:tw-animate-none" />
            <div className="tw-h-3 tw-w-4/5 tw-animate-pulse tw-rounded-md tw-bg-iron-800/60 motion-reduce:tw-animate-none" />
          </div>
          <div className="tw-mt-3 tw-flex tw-gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="tw-h-7 tw-w-20 tw-animate-pulse tw-rounded-full tw-bg-iron-800/60 motion-reduce:tw-animate-none"
              />
            ))}
          </div>
          <div className="tw-mt-auto tw-pt-4">
            <div className="tw-h-4 tw-w-1/2 tw-animate-pulse tw-rounded-md tw-bg-iron-800/60 motion-reduce:tw-animate-none" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-h-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.04] tw-bg-iron-950 tw-p-2">
      {/* Image Skeleton */}
      <div className="tw-h-32 tw-animate-pulse tw-rounded-lg tw-bg-iron-900 sm:tw-h-36 lg:tw-h-32 xl:tw-h-36" />

      {/* Content Skeleton */}
      <div className="tw-px-3 tw-pb-3 tw-pt-4 sm:tw-px-4 sm:tw-pb-4">
        {/* Wave Name Skeleton */}
        <div className="tw-h-5 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800 sm:tw-h-6" />

        {/* Metrics Skeleton */}
        <div className="tw-mt-2.5 tw-h-3 tw-w-1/3 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />

        {/* Message Preview Skeleton */}
        <div className="tw-mt-3 tw-space-y-2">
          <div className="tw-h-3 tw-w-full tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
          <div className="tw-h-3 tw-w-5/6 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
        </div>

        {/* Metadata Skeleton */}
        <div className="tw-mt-4 tw-h-3 tw-w-1/2 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
      </div>
    </div>
  );
}
