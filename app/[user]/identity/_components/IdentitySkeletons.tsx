import CommonSkeletonLoader from "@/components/utils/animation/CommonSkeletonLoader";

export function IdentityTabFallback(): React.JSX.Element {
  return (
    <div
      className="tailwind-scope tw-space-y-8"
      data-testid="identity-tab-fallback"
    >
      <div className="tw-space-y-4">
        <div className="tw-h-6 tw-w-48 tw-rounded tw-bg-iron-900 tw-animate-pulse" />
        <div className="tw-bg-iron-900 tw-border tw-border-iron-800 tw-rounded-xl tw-p-6">
          <CommonSkeletonLoader />
        </div>
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-gap-6 xl:tw-grid-cols-2">
        <div className="tw-bg-iron-900 tw-border tw-border-iron-800 tw-rounded-xl tw-p-6">
          <CommonSkeletonLoader />
        </div>
        <div className="tw-bg-iron-900 tw-border tw-border-iron-800 tw-rounded-xl tw-p-6">
          <CommonSkeletonLoader />
        </div>
      </div>
      <div className="tw-bg-iron-900 tw-border tw-border-iron-800 tw-rounded-xl tw-p-6">
        <CommonSkeletonLoader />
      </div>
    </div>
  );
}

export function StatementsSkeleton(): React.JSX.Element {
  return (
    <div className="tw-mt-6 lg:tw-mt-8">
      <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
        <div className="tw-space-y-2">
          <div className="tw-h-6 tw-w-48 tw-rounded tw-bg-iron-900 tw-animate-pulse" />
          <div className="tw-h-4 tw-w-72 tw-max-w-full tw-rounded tw-bg-iron-900 tw-animate-pulse" />
        </div>
        <div className="tw-mt-4 lg:tw-mt-0 tw-flex tw-items-center tw-gap-3">
          <div className="tw-h-9 tw-w-32 tw-rounded-full tw-bg-iron-900 tw-animate-pulse" />
          <div className="tw-h-9 tw-w-9 tw-rounded-full tw-bg-iron-900 tw-animate-pulse" />
        </div>
      </div>
      <div className="tw-mt-2 lg:tw-mt-4 tw-bg-iron-900 tw-border tw-border-iron-800 tw-border-solid tw-rounded-xl">
        <div className="tw-relative tw-px-4 tw-py-6 lg:tw-p-8 tw-grid tw-grid-cols-1 xl:tw-grid-cols-9 tw-gap-8">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={`statements-skeleton-${index}`}
              className={`tw-col-span-3 tw-space-y-4 ${
                index === 0 ? "tw-col-span-3" : ""
              }`}
            >
              <div className="tw-h-5 tw-w-40 tw-rounded tw-bg-iron-900 tw-animate-pulse" />
              <div className="tw-space-y-3">
                <CommonSkeletonLoader />
              </div>
            </div>
          ))}
          <div className="tw-absolute tw-right-2 lg:tw-right-4 tw-top-2 xl:tw-top-4">
            <div className="tw-h-10 tw-w-10 tw-rounded-full tw-bg-iron-900 tw-animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RatersSkeleton({
  type,
}: {
  readonly type: "given" | "received";
}): React.JSX.Element {
  return (
    <div
      className="tw-flex-1 tw-min-h-full tw-flex tw-flex-col"
      data-testid={`identity-raters-skeleton-${type}`}
    >
      <div className="tw-h-6 tw-w-40 tw-rounded tw-bg-iron-900 tw-animate-pulse" />
      <div className="tw-flex-1 tw-mt-2 lg:tw-mt-4 tw-bg-iron-900 tw-border tw-border-iron-800 tw-border-solid tw-rounded-xl tw-overflow-hidden">
        <div className="tw-border-b tw-border-iron-800 tw-px-4 sm:tw-px-6 tw-py-3">
          <div className="tw-h-4 tw-w-28 tw-rounded tw-bg-iron-800 tw-animate-pulse" />
        </div>
        <div className="tw-space-y-3 tw-p-4 sm:tw-px-6">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={`raters-skeleton-row-${type}-${row}`}
              className="tw-flex tw-items-center tw-justify-between"
            >
              <div className="tw-h-4 tw-w-40 tw-rounded tw-bg-iron-800 tw-animate-pulse" />
              <div className="tw-flex tw-items-center tw-gap-4">
                <div className="tw-h-4 tw-w-16 tw-rounded tw-bg-iron-800 tw-animate-pulse" />
                <div className="tw-h-4 tw-w-20 tw-rounded tw-bg-iron-800 tw-animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ActivitySkeleton(): React.JSX.Element {
  return (
    <div className="tw-mt-8 tw-space-y-4">
      <div className="tw-flex tw-items-center tw-justify-between">
        <div className="tw-h-6 tw-w-52 tw-rounded tw-bg-iron-900 tw-animate-pulse" />
        <div className="tw-h-6 tw-w-16 tw-rounded tw-bg-iron-900 tw-animate-pulse" />
      </div>
      <div className="tw-bg-iron-900 tw-border tw-border-iron-800 tw-border-solid tw-rounded-xl">
        <div className="tw-space-y-3 tw-p-6">
          {[0, 1, 2].map((row) => (
            <div
              key={`activity-skeleton-row-${row}`}
              className="tw-space-y-2 tw-border-b tw-border-iron-800 tw-pb-3 last:tw-border-b-0 last:tw-pb-0"
            >
              <div className="tw-h-4 tw-w-60 tw-max-w-full tw-rounded tw-bg-iron-800 tw-animate-pulse" />
              <div className="tw-h-4 tw-w-40 tw-rounded tw-bg-iron-900 tw-animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
