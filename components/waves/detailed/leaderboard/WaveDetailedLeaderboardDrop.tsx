import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/wave-drops.helpers";
import { WaveDetailedLeaderboardTopThreeDrop } from "./WaveDetailedLeaderboardTopThreeDrop";
import { WaveDetailedLeaderboardDefaultDrop } from "./WaveDetailedLeaderboardDefaultDrop";

interface WaveDetailedLeaderboardDropProps {
  readonly drop: ExtendedDrop;
}

export const WaveDetailedLeaderboardDrop: React.FC<
  WaveDetailedLeaderboardDropProps
> = ({ drop }) => {
  return drop.rank && drop.rank <= 3 ? (
    <WaveDetailedLeaderboardTopThreeDrop drop={drop} />
  ) : (
    <WaveDetailedLeaderboardDefaultDrop drop={drop} />
  );
};
