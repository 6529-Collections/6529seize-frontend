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
    <div className="tw-overflow-hidden tw-rounded-lg tw-bg-iron-950 sm:tw-border sm:tw-border-solid sm:tw-border-iron-700">
      <div className="tw-animate-pulse">
        <div className="tw-h-12 tw-border-b tw-border-iron-700 tw-bg-iron-900" />
        {rowKeys.map((key) => (
          <div
            key={key}
            className="tw-flex tw-h-16 tw-items-center tw-gap-4 tw-border-b tw-border-iron-800 tw-px-6"
          >
            <div className="tw-h-4 tw-w-8 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-8 tw-w-8 tw-rounded-md tw-bg-iron-800" />
            <div className="tw-h-6 tw-w-6 tw-rounded-full tw-bg-iron-800" />
            <div className="tw-h-4 tw-w-32 tw-rounded tw-bg-iron-800" />
            <div className="tw-flex-1" />
            <div className="tw-h-4 tw-w-20 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-4 tw-w-20 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-4 tw-w-24 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-4 tw-w-16 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-4 tw-w-16 tw-rounded tw-bg-iron-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
