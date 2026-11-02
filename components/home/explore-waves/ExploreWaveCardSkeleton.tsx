"use client";

export function ExploreWaveCardSkeleton({
  compact = false,
  horizontalOnMobile = false,
  artworkOverlay = false,
}: {
  readonly compact?: boolean;
  readonly horizontalOnMobile?: boolean;
  readonly artworkOverlay?: boolean;
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

  const cardClassName = artworkOverlay
    ? "tw-relative tw-min-h-72 tw-w-full tw-min-w-0 tw-aspect-square tw-flex-col tw-justify-end tw-rounded-xl md:tw-min-h-0 tw-border-0 tw-shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
    : "tw-min-h-[20rem] tw-flex-col tw-rounded-lg tw-border-white/[0.05]";
  const imageClassName = artworkOverlay
    ? "tw-absolute tw-inset-0 tw-h-full tw-w-full"
    : "tw-h-44 tw-rounded-t-lg sm:tw-h-48 lg:tw-h-44 xl:tw-h-48";
  const contentClassName = artworkOverlay
    ? "tw-relative tw-z-10 tw-flex-none tw-px-[22px] tw-pb-5 tw-pt-16 tw-bg-[linear-gradient(to_top,theme(colors.iron.950)_calc(100%_-_64px),transparent_100%)]"
    : "tw-p-4 tw-pt-3";
  return (
    <div
      className={`${horizontalOnMobile ? "tw-relative tw-min-h-44 tw-flex-row tw-rounded-xl tw-border-white/[0.06] md:tw-aspect-square md:tw-min-h-0 md:tw-flex-col md:tw-justify-end md:tw-border-0 md:tw-shadow-[0_0_0_1px_rgba(255,255,255,0.05)]" : cardClassName} tw-flex tw-h-full tw-overflow-hidden tw-border tw-border-solid tw-bg-iron-950 motion-reduce:[&_*]:tw-animate-none`}
    >
      {/* Image Skeleton */}
      <div
        className={`${horizontalOnMobile ? "tw-w-1/3 tw-self-stretch md:tw-absolute md:tw-inset-0 md:tw-h-full md:tw-w-full" : imageClassName} tw-shrink-0 tw-animate-pulse tw-bg-iron-900 motion-reduce:tw-animate-none`}
      />

      {/* Content Skeleton */}
      <div
        className={`${horizontalOnMobile ? "tw-relative tw-z-10 tw-px-4 tw-py-3.5 md:tw-flex-none md:tw-bg-[linear-gradient(to_top,theme(colors.iron.950)_calc(100%_-_64px),transparent_100%)] md:tw-px-[22px] md:tw-pb-5 md:tw-pt-16" : contentClassName} tw-flex tw-min-w-0 tw-flex-1 tw-flex-col`}
      >
        {/* Wave Name Skeleton */}
        <div className="tw-h-5 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800 sm:tw-h-6" />

        {/* Activity Skeleton */}
        <div
          className={`${horizontalOnMobile ? "tw-mt-1 md:tw-mt-1.5" : "tw-mt-2.5"} tw-h-3 tw-w-1/3 tw-animate-pulse tw-rounded tw-bg-iron-800/60`}
        />

        {/* Message Preview Skeleton */}
        <div
          className={`${horizontalOnMobile ? "tw-mb-3 tw-mt-2 tw-text-sm md:tw-mb-4 md:tw-mt-3 md:tw-min-h-5" : "tw-mb-4 tw-mt-3"} tw-space-y-2`}
        >
          <div className="tw-h-3 tw-w-full tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
          <div
            className={`${horizontalOnMobile ? "tw-hidden" : ""} tw-h-3 tw-w-5/6 tw-animate-pulse tw-rounded tw-bg-iron-800/60`}
          />
        </div>

        {/* Metrics Skeleton */}
        <div
          className={`${horizontalOnMobile ? "tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-2.5 md:tw-mt-0 md:tw-border-t-0 md:tw-pt-0" : ""} tw-mt-auto`}
        >
          <div className="tw-h-3 tw-w-1/2 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
        </div>
      </div>
    </div>
  );
}
