"use client";

export function ExploreWaveCardSkeleton() {
  return (
    <div className="tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-white/10">
      {/* Image Skeleton */}
      <div className="tw-aspect-[16/10] tw-animate-pulse tw-bg-iron-900" />

      {/* Content Skeleton */}
      <div className="tw-p-4">
        {/* Wave Name Skeleton */}
        <div className="tw-h-6 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800" />

        {/* Metadata Skeleton */}
        <div className="tw-mt-2 tw-h-4 tw-w-1/2 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />

        {/* Message Preview Skeleton */}
        <div className="tw-mt-3 tw-flex tw-items-start tw-gap-2">
          <div className="tw-size-4 tw-flex-shrink-0 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
          <div className="tw-h-4 tw-flex-1 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
        </div>
      </div>
    </div>
  );
}
