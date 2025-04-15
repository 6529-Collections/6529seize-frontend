import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import DropVoteProgressing from "../../../drops/view/utils/DropVoteProgressing";

interface WaveLeaderboardGalleryItemVotesProps {
  readonly drop: ExtendedDrop;
  readonly variant?: 'default' | 'subtle';
}

export default function WaveLeaderboardGalleryItemVotes({
  drop,
  variant = 'default',
}: WaveLeaderboardGalleryItemVotesProps) {
  const current = drop.rating ?? 0;
  const isPositive = current >= 0;
  
  // Determine color classes based on variant
  const getColorClass = () => {
    if (variant === 'subtle') {
      // More subtle coloring that doesn't draw focus from the artwork
      return isPositive 
        ? "tw-text-iron-300" 
        : "tw-text-iron-400";
    }
    // Original bright coloring
    return isPositive ? "tw-text-emerald-500" : "tw-text-rose-500";
  };

  return (
    <div className="tw-flex tw-items-center tw-gap-x-1.5">
      <span
        className={`tw-text-sm tw-font-medium ${getColorClass()}`}
      >
        {formatNumberWithCommas(current)}
      </span>
      <DropVoteProgressing 
        current={current} 
        projected={drop.rating_prediction} 
        subtle={variant === 'subtle'}
      />
    </div>
  );
}
