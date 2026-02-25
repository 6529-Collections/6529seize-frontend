import React from "react";

import { WaveSmallLeaderboardItemOutcomes } from "@/components/waves/small-leaderboard/WaveSmallLeaderboardItemOutcomes";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface WaveLeaderboardDropFooterProps {
  readonly drop: ExtendedDrop;
}

export const WaveLeaderboardDropFooter: React.FC<
  WaveLeaderboardDropFooterProps
> = ({ drop }) => {
  return <WaveSmallLeaderboardItemOutcomes drop={drop} />;
};
