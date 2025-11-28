export function UserPageXtdhStatsHeaderSkeleton() {
  return (
    <output
      aria-live="polite"
      aria-busy="true"
      className="tw-block tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-5 tw-shadow-md tw-shadow-black/30"
    >
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className="tw-flex tw-flex-col tw-gap-2 tw-animate-pulse">
            <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-700" />
            <div className="tw-h-6 tw-w-24 tw-rounded tw-bg-iron-600" />
          </div>
        ))}
      </div>
      <div className="tw-mt-4 tw-space-y-2 tw-animate-pulse">
        <div className="tw-h-3 tw-w-32 tw-rounded tw-bg-iron-700" />
        <div className="tw-h-2.5 tw-w-full tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-900" />
        <div className="tw-h-4 tw-w-40 tw-rounded tw-bg-iron-700" />
      </div>
      <div className="tw-mt-4 tw-space-y-2 tw-animate-pulse">
        <div className="tw-h-3 tw-w-36 tw-rounded tw-bg-iron-700" />
        <div className="tw-h-4 tw-w-48 tw-rounded tw-bg-iron-700" />
      </div>
    </output>
  );
}
