'use client';

import { useMemo } from "react";
import type { XtdhGranter } from "@/types/xtdh";

export interface XtdhReceivedGranterAvatarGroupProps {
  readonly granters: XtdhGranter[];
}

export function XtdhReceivedGranterAvatarGroup({
  granters,
}: XtdhReceivedGranterAvatarGroupProps) {
  const previewGranters = useMemo(() => granters.slice(0, 5), [granters]);
  const granterCount = granters.length;
  const additional = Math.max(granterCount - previewGranters.length, 0);

  return (
    <div className="tw-flex tw-items-center tw-gap-2">
      <div className="tw-flex -tw-space-x-2">
        {previewGranters.map((granter) => (
          <img
            key={granter.profileId}
            src={granter.profileImage}
            alt={`${granter.displayName} avatar`}
            className="tw-h-7 tw-w-7 tw-rounded-full tw-border tw-border-iron-800 tw-object-cover"
            loading="lazy"
          />
        ))}
      </div>
      <span className="tw-text-xs tw-text-iron-300">
        {granterCount.toLocaleString()} granter{granterCount === 1 ? "" : "s"}
      </span>
      {additional > 0 && (
        <span className="tw-text-xs tw-font-semibold tw-text-iron-200">
          +{additional} more
        </span>
      )}
    </div>
  );
}
