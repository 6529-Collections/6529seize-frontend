import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/wave-drops.helpers";
import { WaveDetailedLeaderboardTopThreeDrop } from "./WaveDetailedLeaderboardTopThreeDrop";
import { WaveDetailedLeaderboardDefaultDrop } from "./WaveDetailedLeaderboardDefaultDrop";
import { ApiWave } from "../../../../generated/models/ApiWave";

interface WaveDetailedLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
}

export const WaveDetailedLeaderboardDrop: React.FC<
  WaveDetailedLeaderboardDropProps
> = ({ drop, wave }) => {
  return drop.rank && drop.rank <= 3 ? (
    <WaveDetailedLeaderboardTopThreeDrop drop={drop} wave={wave} />
  ) : (
   
      <WaveDetailedLeaderboardDefaultDrop drop={drop} wave={wave}/>
 
  );
};
