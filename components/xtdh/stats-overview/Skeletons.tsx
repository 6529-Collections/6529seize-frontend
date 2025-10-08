export function XtdhStatsOverviewSkeleton() {
  return (
    <section className="tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-6 tw-shadow-md tw-shadow-black/30 tw-text-iron-50">
      <div className="tw-h-7 tw-w-40 tw-rounded tw-bg-iron-800 tw-animate-pulse" />
      <div className="tw-mt-6 tw-grid tw-gap-6 xl:tw-grid-cols-2">
        <NetworkStatsSkeleton />
        <UserStatusSkeleton />
      </div>
    </section>
  );
}

export function NetworkStatsSkeleton() {
  return (
    <div className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-5 tw-space-y-5 tw-animate-pulse">
      <div className="tw-space-y-2">
        <div className="tw-h-5 tw-w-32 tw-rounded tw-bg-iron-800" />
        <div className="tw-h-3 tw-w-48 tw-rounded tw-bg-iron-800" />
      </div>
      <div className="tw-h-20 tw-rounded-xl tw-bg-primary-500/20" />
      <div className="tw-space-y-3">
        <div className="tw-h-3 tw-w-full tw-rounded-full tw-bg-iron-800" />
        <div className="tw-h-6 tw-w-full tw-rounded tw-bg-iron-800" />
      </div>
      <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="tw-space-y-2 tw-rounded-lg tw-bg-iron-950 tw-p-4"
          >
            <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-6 tw-w-24 tw-rounded tw-bg-iron-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function UserStatusSkeleton() {
  return (
    <div className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-5 tw-flex tw-flex-col tw-gap-4 tw-animate-pulse">
      <div className="tw-h-5 tw-w-32 tw-rounded tw-bg-iron-800" />
      <div className="tw-h-20 tw-rounded-xl tw-bg-iron-800" />
      <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2">
        <div className="tw-h-16 tw-rounded-lg tw-bg-iron-800" />
        <div className="tw-h-16 tw-rounded-lg tw-bg-iron-800" />
      </div>
      <div className="tw-ml-auto tw-h-10 tw-w-32 tw-rounded-lg tw-bg-iron-800" />
    </div>
  );
}
