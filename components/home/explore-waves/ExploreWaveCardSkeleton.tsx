"use client";

export function ExploreWaveCardSkeleton({
  compact = false,
  horizontalOnMobile = false,
}: {
  readonly compact?: boolean;
  readonly horizontalOnMobile?: boolean;
}) {
  if (compact) {
    return (
      <div
        aria-hidden="true"
        className="tw-flex tw-h-full tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.05] tw-bg-iron-950"
      >
        <div className="tw-w-20 tw-shrink-0 tw-animate-pulse tw-bg-iron-900 motion-reduce:tw-animate-none sm:tw-w-24" />
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-p-3">
          <div className="tw-h-6">
            <div className="tw-h-5 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800 motion-reduce:tw-animate-none" />
          </div>
          <div className="tw-mt-1 tw-h-4 tw-w-2/3 tw-animate-pulse tw-rounded tw-bg-iron-800/60 motion-reduce:tw-animate-none" />
          <div className="tw-mt-1.5 tw-h-[18px]">
            <div className="tw-h-3 tw-w-full tw-animate-pulse tw-rounded tw-bg-iron-800/60 motion-reduce:tw-animate-none" />
          </div>
          <div className="tw-mt-2 tw-h-5 tw-w-1/2 tw-animate-pulse tw-rounded tw-bg-iron-800/60 motion-reduce:tw-animate-none" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${horizontalOnMobile ? "tw-min-h-44 tw-flex-row tw-rounded-xl tw-border-white/[0.06] md:tw-min-h-[20rem] md:tw-flex-col" : "tw-min-h-[20rem] tw-flex-col tw-rounded-lg tw-border-white/[0.05]"} tw-flex tw-h-full tw-overflow-hidden tw-border tw-border-solid tw-bg-iron-950 motion-reduce:[&_*]:tw-animate-none`}
    >
      {/* Image Skeleton */}
      <div
        className={`${horizontalOnMobile ? "tw-w-1/3 tw-self-stretch md:tw-h-48 md:tw-w-full lg:tw-h-44 xl:tw-h-48" : "tw-h-44 tw-rounded-t-lg sm:tw-h-48 lg:tw-h-44 xl:tw-h-48"} tw-shrink-0 tw-animate-pulse tw-bg-iron-900 motion-reduce:tw-animate-none`}
      />

      {/* Content Skeleton */}
      <div
        className={`${horizontalOnMobile ? "tw-px-4 tw-py-3.5 md:tw-px-5 md:tw-py-[18px]" : "tw-p-4 tw-pt-3"} tw-flex tw-min-w-0 tw-flex-1 tw-flex-col`}
      >
        {/* Wave Name Skeleton */}
        <div className="tw-h-5 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800 sm:tw-h-6" />

        {/* Activity Skeleton */}
        <div
          className={`${horizontalOnMobile ? "tw-mt-1" : "tw-mt-2.5"} tw-h-3 tw-w-1/3 tw-animate-pulse tw-rounded tw-bg-iron-800/60`}
        />

        {/* Message Preview Skeleton */}
        <div
          className={`${horizontalOnMobile ? "tw-mb-3 tw-mt-2 tw-text-sm md:tw-mb-[18px] md:tw-mt-2.5 md:tw-min-h-[2.9em]" : "tw-mt-3"} tw-space-y-2`}
        >
          <div className="tw-h-3 tw-w-full tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
          <div
            className={`${horizontalOnMobile ? "tw-hidden md:tw-block" : ""} tw-h-3 tw-w-5/6 tw-animate-pulse tw-rounded tw-bg-iron-800/60`}
          />
        </div>

        {/* Metrics Skeleton */}
        <div
          className={`${horizontalOnMobile ? "tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-2.5 md:tw-pt-3.5" : ""} tw-mt-auto`}
        >
          <div className="tw-h-3 tw-w-1/2 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
        </div>
      </div>
    </div>
  );
}
