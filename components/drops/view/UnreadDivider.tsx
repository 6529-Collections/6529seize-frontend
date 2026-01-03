"use client";

import { memo } from "react";

interface UnreadDividerProps {
  readonly label?: string | undefined;
}

const UnreadDivider = memo(function UnreadDivider({
  label = "New Messages",
}: UnreadDividerProps) {
  return (
    <div className="tw-flex tw-items-center tw-gap-3 tw-py-0.5 tw-px-2">
      <div className="tw-flex-1 tw-h-0.5 tw-bg-rose-500" />
      <span className="tw-text-xs tw-font-semibold tw-text-rose-500 tw-whitespace-nowrap">
        {label}
      </span>
      <div className="tw-flex-1 tw-h-0.5 tw-bg-rose-500" />
    </div>
  );
});

export default UnreadDivider;
