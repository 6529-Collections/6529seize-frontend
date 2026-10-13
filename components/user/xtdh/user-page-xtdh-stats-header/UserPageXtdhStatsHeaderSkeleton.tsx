export function UserPageXtdhStatsHeaderSkeleton() {
  return (
    <output
      aria-live="polite"
      aria-busy="true"
      className="tw-grid tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.04] tw-bg-iron-900 lg:tw-grid-cols-[minmax(0,1.78fr)_minmax(0,1fr)]"
    >
      <div className="tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-2 tw-p-5 sm:tw-p-6">
        <div className="tw-mb-3 tw-flex tw-basis-full tw-animate-pulse tw-flex-col tw-gap-2">
          <div className="tw-h-3 tw-w-16 tw-rounded tw-bg-iron-800" />
          <div className="tw-h-8 tw-w-36 tw-rounded tw-bg-iron-800 sm:tw-h-9" />
        </div>
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className="tw-flex tw-animate-pulse tw-items-center tw-gap-1"
          >
            <div className="tw-h-3 tw-w-16 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-4 tw-w-16 tw-rounded tw-bg-iron-800" />
          </div>
        ))}
      </div>
      <div className="tw-animate-pulse tw-space-y-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.04] tw-bg-black/35 tw-p-5 sm:tw-p-6 lg:tw-border-l lg:tw-border-t-0">
        <div className="tw-h-3 tw-w-32 tw-rounded tw-bg-iron-800" />
        <div className="tw-h-8 tw-w-40 tw-rounded tw-bg-iron-800 sm:tw-h-9" />
        <div className="!tw-mt-6 tw-h-1 tw-w-full tw-rounded-full tw-bg-white/[0.06]" />
      </div>
    </output>
  );
}
