export function UserPageXtdhStatsHeaderSkeleton() {
  return (
    <output
      aria-live="polite"
      aria-busy="true"
      className="tw-grid tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.04] tw-bg-iron-900 lg:tw-grid-cols-[minmax(0,1.78fr)_minmax(0,1fr)]"
    >
      <div className="tw-flex tw-flex-col tw-flex-wrap tw-gap-x-5 tw-gap-y-2 tw-px-4 tw-pb-1 tw-pt-4 md:tw-flex-row md:tw-p-6">
        <div className="tw-mb-2.5 tw-flex tw-animate-pulse tw-flex-col tw-gap-2 md:tw-mb-3 md:tw-basis-full">
          <div className="tw-h-3 tw-w-16 tw-rounded tw-bg-iron-800" />
          <div className="tw-h-[34px] tw-w-36 tw-rounded tw-bg-iron-800 sm:tw-h-9" />
        </div>
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className="tw-flex tw-min-h-8 tw-animate-pulse tw-items-center tw-justify-between tw-gap-1 md:tw-min-h-0 md:tw-justify-start"
          >
            <div className="tw-h-3 tw-w-16 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-4 tw-w-16 tw-rounded tw-bg-iron-800" />
          </div>
        ))}
      </div>
      <div className="tw-animate-pulse tw-space-y-2 tw-px-4 tw-pb-4 md:tw-border-x-0 md:tw-border-b-0 md:tw-border-t md:tw-border-solid md:tw-border-white/[0.04] md:tw-bg-black/35 md:tw-p-6 lg:tw-border-l lg:tw-border-t-0">
        <div className="tw-hidden tw-h-3 tw-w-32 tw-rounded tw-bg-iron-800 md:tw-block" />
        <div className="tw-h-8 tw-w-full tw-rounded tw-bg-iron-800 md:tw-h-9 md:tw-w-40" />
        <div className="!tw-mt-2 tw-h-1 tw-w-full tw-rounded-full tw-bg-white/[0.06] md:!tw-mt-6" />
      </div>
    </output>
  );
}
