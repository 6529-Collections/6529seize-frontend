import React from "react";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import { ApiWave } from "../../../../../generated/models/ApiWave";
import { WaveSmallLeaderboardItemOutcomes } from "../../../small-leaderboard/WaveSmallLeaderboardItemOutcomes";

interface WaveLeaderboardDropFooterProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
}

export const WaveLeaderboardDropFooter: React.FC<
  WaveLeaderboardDropFooterProps
> = ({ drop, wave }) => {
  return <WaveSmallLeaderboardItemOutcomes drop={drop} wave={wave} />;
};
