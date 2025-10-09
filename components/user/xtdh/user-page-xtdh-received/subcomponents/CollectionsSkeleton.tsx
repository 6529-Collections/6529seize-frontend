'use client';

export function UserPageXtdhReceivedCollectionsSkeleton() {
  return (
    <div className="tw-space-y-3">
      {[0, 1, 2].map((key) => (
        <div
          key={key}
          className="tw-animate-pulse tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4"
        >
          <div className="tw-h-16 tw-rounded-xl tw-bg-iron-800" />
        </div>
      ))}
    </div>
  );
}
