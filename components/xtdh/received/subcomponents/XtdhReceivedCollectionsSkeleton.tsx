'use client';

export function XtdhReceivedCollectionsSkeleton() {
  return (
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-animate-pulse"
        >
          <div className="tw-flex tw-flex-col tw-gap-3 tw-px-4 tw-py-3.5">
            <div className="tw-flex tw-items-start tw-gap-3">
              <div className="tw-h-16 tw-w-16 tw-rounded-xl tw-bg-iron-800" />
              <div className="tw-flex-1 tw-space-y-2">
                <div className="tw-h-4 tw-w-32 tw-rounded tw-bg-iron-800" />
                <div className="tw-flex tw-gap-1.5">
                  <div className="tw-h-4 tw-w-14 tw-rounded-full tw-bg-iron-800" />
                  <div className="tw-h-4 tw-w-12 tw-rounded-full tw-bg-iron-800" />
                </div>
              </div>
              <div className="tw-h-6 tw-w-6 tw-rounded-full tw-bg-iron-800" />
            </div>
            <div className="tw-grid tw-grid-cols-2 tw-gap-3">
              <div className="tw-h-9 tw-rounded-lg tw-bg-iron-850" />
              <div className="tw-h-9 tw-rounded-lg tw-bg-iron-850" />
            </div>
            <div className="tw-h-3 tw-w-48 tw-rounded tw-bg-iron-800" />
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-flex -tw-space-x-2">
                <div className="tw-h-7 tw-w-7 tw-rounded-full tw-bg-iron-800" />
                <div className="tw-h-7 tw-w-7 tw-rounded-full tw-bg-iron-800" />
                <div className="tw-h-7 tw-w-7 tw-rounded-full tw-bg-iron-800" />
                <div className="tw-h-7 tw-w-7 tw-rounded-full tw-bg-iron-800" />
              </div>
              <div className="tw-h-3 tw-w-16 tw-rounded tw-bg-iron-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
