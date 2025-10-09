'use client';

import type { XtdhGranterPreview } from "@/types/xtdh";

export interface XtdhReceivedGranterAvatarGroupProps {
  readonly granters: XtdhGranterPreview[];
  readonly granterCount: number;
  readonly additional: number;
}

export function XtdhReceivedGranterAvatarGroup({
  granters,
  granterCount,
  additional,
}: XtdhReceivedGranterAvatarGroupProps) {
  return (
    <div className="tw-flex tw-items-center tw-gap-2">
      <div className="tw-flex -tw-space-x-2">
        {granters.map((granter) => (
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
