'use client';

export function XtdhReceivedCollectionsSkeleton() {
  return (
    <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className="tw-h-48 tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-animate-pulse"
        >
          <div className="tw-flex tw-h-full tw-flex-col tw-gap-4">
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-h-14 tw-w-14 tw-rounded-xl tw-bg-iron-800" />
              <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-2">
                <div className="tw-h-4 tw-w-32 tw-rounded tw-bg-iron-800" />
                <div className="tw-h-3 tw-w-24 tw-rounded tw-bg-iron-800" />
              </div>
            </div>
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
              <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-7 tw-w-24 tw-rounded-full tw-bg-iron-800" />
            </div>
            <div className="tw-h-7 tw-w-7 tw-self-end tw-rounded-full tw-bg-iron-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
