import React from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WaveSmallLeaderboardItemOutcomes } from "@/components/waves/small-leaderboard/WaveSmallLeaderboardItemOutcomes";

interface WaveLeaderboardDropFooterProps {
  readonly drop: ExtendedDrop;
}

export const WaveLeaderboardDropFooter: React.FC<
  WaveLeaderboardDropFooterProps
> = ({ drop }) => {
  return <WaveSmallLeaderboardItemOutcomes drop={drop} />;
};
