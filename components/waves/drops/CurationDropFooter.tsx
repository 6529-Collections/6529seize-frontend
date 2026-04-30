"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import clsx from "clsx";
import WaveDropActionsAddReaction from "./WaveDropActionsAddReaction";
import WaveDropActionsCopyLink from "./WaveDropActionsCopyLink";
import WaveDropReactions from "./WaveDropReactions";

interface CurationDropFooterProps {
  readonly drop: ExtendedDrop;
  readonly className?: string | undefined;
}

export default function CurationDropFooter({
  drop,
  className,
}: CurationDropFooterProps) {
  const hasVisibleReactions = drop.reactions.some(
    (reaction) => reaction.profiles.length > 0
  );

  return (
    <div
      className={clsx(
        "tw-relative tw-z-20 tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-3 tw-gap-y-2",
        className
      )}
      data-text-selection-exclude="true"
    >
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
        {hasVisibleReactions && (
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
            <WaveDropReactions drop={drop} />
          </div>
        )}
        <div className="tw-mt-1 tw-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-dashed tw-border-iron-700/80 tw-bg-iron-900/20 tw-transition-colors tw-duration-200 desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-bg-iron-900/40">
          <WaveDropActionsAddReaction
            drop={drop}
            size="compact"
            updateCurationCache
          />
        </div>
      </div>
      <div className="tw-ml-2 tw-mt-1 tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-text-iron-500 desktop-hover:hover:tw-text-iron-300">
        <WaveDropActionsCopyLink drop={drop} size="compact" />
      </div>
    </div>
  );
}
