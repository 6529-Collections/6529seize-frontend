"use client";

export function ExploreWaveCardSkeleton() {
  return (
    <div className="tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-white/10">
      {/* Image Skeleton */}
      <div className="tw-aspect-[2/1] tw-animate-pulse tw-bg-iron-900" />

      {/* Content Skeleton */}
      <div className="tw-px-4 tw-py-6 sm:tw-p-5">
        {/* Wave Name Skeleton */}
        <div className="tw-h-5 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800 sm:tw-h-6" />

        {/* Metadata Skeleton */}
        <div className="tw-mt-2 tw-h-4 tw-w-1/2 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />

        {/* Message Preview Skeleton */}
        <div className="tw-mt-3 tw-flex tw-items-start tw-gap-2 sm:tw-gap-3">
          <div className="tw-size-3.5 tw-flex-shrink-0 tw-animate-pulse tw-rounded tw-bg-iron-800/60 sm:tw-size-4" />
          <div className="tw-h-4 tw-flex-1 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
        </div>
      </div>
    </div>
  );
}
