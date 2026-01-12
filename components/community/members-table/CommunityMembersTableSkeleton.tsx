import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import { useMemo } from "react";

export default function CommunityMembersTableSkeleton({
  rows = 10,
}: {
  readonly rows?: number;
}) {
  const rowKeys = useMemo(
    () => Array.from({ length: rows }, () => getRandomObjectId()),
    [rows]
  );

  return (
    <>
      <div className="tw-hidden tw-overflow-hidden tw-rounded-lg tw-bg-iron-950 tw-shadow sm:tw-block sm:tw-border sm:tw-border-solid sm:tw-border-iron-700">
        <div className="tw-animate-pulse">
          <div className="tw-h-12 tw-border-b tw-border-iron-700 tw-bg-iron-900" />
          {rowKeys.map((key) => (
            <div
              key={key}
              className="tw-flex tw-h-16 tw-items-center tw-gap-4 tw-border-b tw-border-iron-800 tw-px-6"
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
            className="tw-flex tw-animate-pulse tw-flex-col tw-gap-y-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/80 tw-p-3"
          >
            <div className="tw-flex tw-w-full tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-x-2">
                <div className="tw-h-4 tw-w-6 tw-rounded tw-bg-iron-800" />
                <div className="tw-h-11 tw-w-11 tw-rounded-md tw-bg-iron-800" />
                <div className="tw-flex tw-flex-col tw-gap-y-1.5">
                  <div className="tw-h-4 tw-w-28 tw-rounded tw-bg-iron-800" />
                  <div className="tw-h-5 tw-w-16 tw-rounded-full tw-bg-iron-800" />
                </div>
              </div>
              <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-800" />
            </div>
            <div className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-h-4 tw-w-14 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-4 tw-w-14 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-4 tw-w-12 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-4 tw-w-12 tw-rounded tw-bg-iron-800" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
