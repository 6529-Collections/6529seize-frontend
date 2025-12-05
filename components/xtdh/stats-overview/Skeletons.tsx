const NETWORK_STAT_CARD_KEYS = [
  "network-card-1",
  "network-card-2",
  "network-card-3",
  "network-card-4",
  "network-card-5",
  "network-card-6",
] as const;

const USER_STATUS_METRIC_KEYS = [
  "user-status-metric-1",
  "user-status-metric-2",
  "user-status-metric-3",
  "user-status-metric-4",
] as const;

const USER_STATUS_ACTIVITY_KEYS = [
  "user-status-activity-1",
  "user-status-activity-2",
] as const;

export function XtdhStatsOverviewSkeleton() {
  return (
    <section
      aria-busy="true"
      className="tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-6 tw-shadow-md tw-shadow-black/30 tw-text-iron-50"
    >
      <div className="tw-h-7 tw-w-40 tw-rounded tw-bg-iron-800 tw-animate-pulse" />
      <div className="tw-mt-6 tw-rounded-2xl tw-border tw-border-primary-500/20 tw-bg-primary-500/10 tw-p-6 tw-animate-pulse">
        <div className="tw-h-4 tw-w-36 tw-rounded tw-bg-primary-500/30" />
        <div className="tw-mt-4 tw-h-8 tw-w-48 tw-rounded tw-bg-primary-500/30" />
        <div className="tw-mt-2 tw-h-4 tw-w-52 tw-rounded tw-bg-primary-500/20" />
        <div className="tw-mt-4 tw-h-12 tw-w-full tw-rounded tw-bg-primary-500/20" />
      </div>
      <div className="tw-mt-6 tw-grid tw-gap-6 xl:tw-grid-cols-2">
        <NetworkStatsSkeleton />
        <UserStatusSkeleton />
      </div>
    </section>
  );
}

export function NetworkStatsSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-5 tw-space-y-5 tw-animate-pulse"
    >
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
        {NETWORK_STAT_CARD_KEYS.map((key) => (
          <div
            key={key}
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
    <div
      aria-hidden="true"
      className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-5 tw-flex tw-flex-col tw-gap-4 tw-animate-pulse"
    >
      <div className="tw-space-y-2">
        <div className="tw-h-5 tw-w-32 tw-rounded tw-bg-iron-800" />
        <div className="tw-h-3 tw-w-56 tw-rounded tw-bg-iron-800" />
      </div>
      <div className="tw-h-20 tw-rounded-xl tw-bg-iron-800" />
      <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2">
        {USER_STATUS_METRIC_KEYS.map((key) => (
          <div key={key} className="tw-h-16 tw-rounded-lg tw-bg-iron-800" />
        ))}
      </div>
      <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2">
        {USER_STATUS_ACTIVITY_KEYS.map((key) => (
          <div key={key} className="tw-h-16 tw-rounded-lg tw-bg-iron-800" />
        ))}
      </div>
    </div>
  );
}
