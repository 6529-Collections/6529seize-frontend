import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WaveSmallLeaderboardTopThreeDrop } from "./WaveSmallLeaderboardTopThreeDrop";
import { WaveSmallLeaderboardDefaultDrop } from "./WaveSmallLeaderboardDefaultDrop";

interface MemesWaveSmallLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: () => void;
}

export const MemesWaveSmallLeaderboardDrop: React.FC<
  MemesWaveSmallLeaderboardDropProps
> = ({ drop, onDropClick }) => {
  return (
    <div className="tw-cursor-pointer" onClick={onDropClick}>
      {drop.rank && drop.rank <= 3 ? (
        <WaveSmallLeaderboardTopThreeDrop
          drop={drop}
          onDropClick={onDropClick}
        />
      ) : (
        <WaveSmallLeaderboardDefaultDrop
          drop={drop}
          onDropClick={onDropClick}
        />
      )}
    </div>
  );
};
