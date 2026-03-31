"use client";

export function ExploreWaveCardSkeleton() {
  return (
    <div className="tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-white/10">
      {/* Image Skeleton */}
      <div className="tw-aspect-[20/9] tw-animate-pulse tw-bg-iron-900" />

      {/* Content Skeleton */}
      <div className="tw-px-4 tw-py-6 sm:tw-p-5">
        {/* Wave Name Skeleton */}
        <div className="tw-h-5 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800 sm:tw-h-6" />

        {/* Message Preview Skeleton */}
        <div className="tw-mt-2 tw-space-y-2">
          <div className="tw-h-3 tw-w-full tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
          <div className="tw-h-3 tw-w-5/6 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
        </div>

        {/* Metadata Skeleton */}
        <div className="tw-mt-5 tw-h-4 tw-w-1/2 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
      </div>
    </div>
  );
}
