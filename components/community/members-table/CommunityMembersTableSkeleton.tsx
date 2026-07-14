import { useMemo } from "react";

export default function CommunityMembersTableSkeleton({
  rows = 10,
}: {
  readonly rows?: number;
}) {
  const rowKeys = useMemo(
    () =>
      Array.from({ length: rows }, (_, index) => `member-skeleton-${index}`),
    [rows]
  );

  return (
    <output className="tw-block" aria-label="Loading Network members">
      <div className="tw-hidden tw-overflow-hidden sm:tw-block">
        <div className="tw-animate-pulse">
          <div className="tw-h-10 tw-border-b tw-border-iron-800" />
          {rowKeys.map((key) => (
            <div
              key={key}
              className="tw-flex tw-h-16 tw-items-center tw-gap-4 tw-border-b tw-border-iron-800 tw-px-4 odd:tw-bg-iron-900/45"
            >
              <div className="tw-h-4 tw-w-8 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-8 tw-w-8 tw-rounded-md tw-bg-iron-800" />
              <div className="tw-h-4 tw-w-24 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-7 tw-w-7 tw-rounded-full tw-bg-iron-800" />
              <div className="tw-flex-1" />
              <div className="tw-h-4 tw-w-14 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-4 tw-w-14 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-4 tw-w-12 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-4 tw-w-12 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-4 tw-w-16 tw-rounded tw-bg-iron-800" />
            </div>
          ))}
        </div>
      </div>

      <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-y-3 sm:tw-hidden">
        {rowKeys.map((key) => (
          <div
            key={key}
            className="tw-flex tw-animate-pulse tw-flex-col tw-gap-y-3 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3"
          >
            <div className="tw-flex tw-w-full tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-x-2">
                <div className="tw-h-4 tw-w-6 tw-rounded tw-bg-iron-800" />
                <div className="tw-size-11 tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-white/10" />
                <div className="tw-flex tw-flex-col tw-gap-y-1.5">
                  <div className="tw-h-4 tw-w-28 tw-rounded tw-bg-iron-800" />
                  <div className="tw-h-5 tw-w-16 tw-rounded-full tw-bg-iron-800" />
                </div>
              </div>
              <div className="tw-flex tw-flex-col tw-items-end tw-gap-y-1.5">
                <div className="tw-h-3 tw-w-14 tw-rounded tw-bg-iron-800" />
                <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-800" />
              </div>
            </div>
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
              <div className="tw-h-4 tw-w-14 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-4 tw-w-14 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-4 tw-w-12 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-4 tw-w-12 tw-rounded tw-bg-iron-800" />
            </div>
          </div>
        ))}
      </div>
      <span className="tw-sr-only">Loading Network members</span>
    </output>
  );
}
