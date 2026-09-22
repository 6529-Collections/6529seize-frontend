"use client";

export function ExploreWaveCardSkeleton() {
  return (
    <div className="tw-flex tw-h-full tw-min-h-[20rem] tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.05] tw-bg-iron-950">
      {/* Image Skeleton */}
      <div className="tw-h-44 tw-animate-pulse tw-rounded-t-lg tw-bg-iron-900 sm:tw-h-48 lg:tw-h-44 xl:tw-h-48" />

      {/* Content Skeleton */}
      <div className="tw-flex tw-flex-1 tw-flex-col tw-p-4 tw-pt-3">
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
        <div className="tw-mt-auto tw-h-3 tw-w-1/2 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
      </div>
    </div>
  );
}
