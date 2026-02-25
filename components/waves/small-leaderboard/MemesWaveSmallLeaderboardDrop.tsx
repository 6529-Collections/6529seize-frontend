import React from "react";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

import { WaveSmallLeaderboardDefaultDrop } from "./WaveSmallLeaderboardDefaultDrop";
import { WaveSmallLeaderboardTopThreeDrop } from "./WaveSmallLeaderboardTopThreeDrop";

interface MemesWaveSmallLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: () => void;
}

export const MemesWaveSmallLeaderboardDrop: React.FC<
  MemesWaveSmallLeaderboardDropProps
> = ({ drop, onDropClick }) => {
  return (
    <div className="tw-cursor-pointer" onClick={onDropClick}>
      {typeof drop.rank === "number" && drop.rank <= 3 ? (
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
