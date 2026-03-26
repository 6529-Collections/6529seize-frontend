"use client";

import WaveDropAuthorPfp from "@/components/waves/drops/WaveDropAuthorPfp";
import WaveDropTime from "@/components/waves/drops/time/WaveDropTime";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface MemesQuickVoteDropHeaderProps {
  readonly drop: ExtendedDrop;
}

export default function MemesQuickVoteDropHeader({
  drop,
}: MemesQuickVoteDropHeaderProps) {
  const authorLabel = drop.author.handle ?? drop.author.primary_address;

  return (
    <div className="tw-flex tw-items-center tw-gap-3">
      <WaveDropAuthorPfp drop={drop} />
      <div className="tw-min-w-0 tw-flex-1">
        <div className="tw-mb-2.5 tw-flex tw-items-center tw-gap-1.5">
          <span className="tw-truncate tw-text-md tw-font-bold tw-leading-none tw-tracking-tight tw-text-white">
            {authorLabel}
          </span>
          <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-iron-500 [&_p]:tw-mb-0">
            <span className="tw-text-xs tw-font-medium tw-leading-none">•</span>
            <WaveDropTime timestamp={drop.created_at} />
          </span>
        </div>
        <p className="tw-mb-0 tw-truncate tw-text-[9px] tw-font-semibold tw-uppercase tw-leading-none tw-tracking-widest tw-text-iron-500">
          {drop.wave.name}
        </p>
      </div>
    </div>
  );
}
