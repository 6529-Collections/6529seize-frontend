"use client";

import { memo } from "react";

interface UnreadDividerProps {
  readonly label?: string | undefined;
}

const UnreadDivider = memo(function UnreadDivider({
  label = "New Messages",
}: UnreadDividerProps) {
  return (
    <div className="tw-flex tw-items-center tw-gap-3 tw-px-2 tw-py-0.5">
      <div className="tw-h-0.5 tw-flex-1 tw-bg-indigo-500" />
      <span className="tw-whitespace-nowrap tw-text-xs tw-font-semibold tw-text-indigo-500">
        {label}
      </span>
      <div className="tw-h-0.5 tw-flex-1 tw-bg-indigo-500" />
    </div>
  );
});

export default UnreadDivider;
