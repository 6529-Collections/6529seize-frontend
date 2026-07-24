"use client";

export function ExploreWaveCardSkeleton() {
  return (
    <div className="tw-h-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.04] tw-bg-iron-950 tw-p-2">
      {/* Image Skeleton */}
      <div className="tw-h-32 tw-animate-pulse tw-rounded-lg tw-bg-iron-900 sm:tw-h-36 lg:tw-h-32 xl:tw-h-36" />

      {/* Content Skeleton */}
      <div className="tw-px-3 tw-pb-3 tw-pt-4 sm:tw-px-4 sm:tw-pb-4">
        {/* Wave Name Skeleton */}
        <div className="tw-h-5 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800 sm:tw-h-6" />

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
