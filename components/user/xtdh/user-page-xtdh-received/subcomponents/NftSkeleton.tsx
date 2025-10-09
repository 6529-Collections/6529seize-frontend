'use client';

export function UserPageXtdhReceivedNftSkeleton() {
  return (
    <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-3">
      {[0, 1, 2, 3].map((key) => (
        <div
          key={key}
          className="tw-animate-pulse tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4"
        >
          <div className="tw-h-20 tw-rounded-xl tw-bg-iron-800" />
        </div>
      ))}
    </div>
  );
}
