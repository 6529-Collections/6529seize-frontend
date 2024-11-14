import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/wave-drops.helpers";
import { WaveDetailedLeaderboardTopThreeDrop } from "./WaveDetailedLeaderboardTopThreeDrop";
import { WaveDetailedLeaderboardDefaultDrop } from "./WaveDetailedLeaderboardDefaultDrop";
import { ApiWave } from "../../../../generated/models/ApiWave";

interface WaveDetailedLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveDetailedLeaderboardDrop: React.FC<
  WaveDetailedLeaderboardDropProps
> = ({ drop, wave, onDropClick }) => {
  return (
    <div className="tw-cursor-pointer" onClick={() => onDropClick(drop)}>
      {drop.rank && drop.rank <= 3 ? (
        <WaveDetailedLeaderboardTopThreeDrop
          drop={drop}
          wave={wave}
          onDropClick={onDropClick}
        />
      ) : (
        <WaveDetailedLeaderboardDefaultDrop
          drop={drop}
          wave={wave}
          onDropClick={onDropClick}
        />
      )}
    </div>
  );
};
