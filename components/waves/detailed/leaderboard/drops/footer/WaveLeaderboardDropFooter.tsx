import React from "react";
import { ExtendedDrop } from "../../../../../../helpers/waves/drop.helpers";
import { ApiWave } from "../../../../../../generated/models/ApiWave";
import { WaveDetailedLeaderboardItemOutcomes } from "../../../small-leaderboard/WaveDetailedLeaderboardItemOutcomes";

interface WaveLeaderboardDropFooterProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
}

export const WaveLeaderboardDropFooter: React.FC<
  WaveLeaderboardDropFooterProps
> = ({ drop, wave }) => {
  return <WaveDetailedLeaderboardItemOutcomes drop={drop} wave={wave} />;
};
