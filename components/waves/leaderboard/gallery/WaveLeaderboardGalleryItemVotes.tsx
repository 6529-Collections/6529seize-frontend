import React, { useState, useEffect } from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import DropVoteProgressing from "../../../drops/view/utils/DropVoteProgressing";
import { WaveDropsLeaderboardSort } from "../../../../hooks/useWaveDropsLeaderboard";

interface WaveLeaderboardGalleryItemVotesProps {
  readonly drop: ExtendedDrop;
  readonly variant?: 'default' | 'subtle';
  readonly activeSort?: WaveDropsLeaderboardSort;
}

export default function WaveLeaderboardGalleryItemVotes({
  drop,
  variant = 'default',
  activeSort,
}: WaveLeaderboardGalleryItemVotesProps) {
  const current = drop.rating ?? 0;
  const isPositive = current >= 0;
  
  const [animationKey, setAnimationKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animation trigger when active tab changes
  useEffect(() => {
    if (activeSort) {
      setAnimationKey(prev => prev + 1);
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeSort]);
  
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
        className={`tw-text-sm tw-font-medium ${getColorClass()} tw-transition-all tw-duration-300 ${isAnimating ? 'tw-scale-125 tw-font-bold tw-text-white' : 'tw-scale-100'}`}
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
