import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";

interface WaveLeaderboardDropRankIndicatorProps {
  readonly drop: ExtendedDrop;
}

export const WaveLeaderboardDropRankIndicator: React.FC<
  WaveLeaderboardDropRankIndicatorProps
> = ({ drop }) => {
  const getBadgeClass = (rank: number | null) => {
    if (!rank) return "tw-text-iron-400 tw-bg-iron-800/40 tw-border-iron-700/30";
    if (rank === 1) return "tw-text-[#E8D48A] tw-bg-[#E8D48A]/10 tw-border-[#E8D48A]/30";
    if (rank === 2) return "tw-text-[#DDDDDD] tw-bg-[#DDDDDD]/10 tw-border-[#DDDDDD]/30";
    if (rank === 3) return "tw-text-[#CD7F32] tw-bg-[#CD7F32]/10 tw-border-[#CD7F32]/30";
    return "tw-text-iron-300 tw-bg-iron-800/40 tw-border-iron-700/30";
  };

  return (
    <div className={`tw-rounded-md tw-py-1 tw-px-2 tw-h-6 tw-font-medium tw-text-xs tw-inline-flex tw-items-center tw-gap-x-1 tw-border ${getBadgeClass(drop.rank)}`}>
      {drop.rank ? `#${drop.rank}` : "-"}
    </div>
  );
};
