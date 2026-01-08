import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WaveSmallLeaderboardTopThreeDrop } from "./WaveSmallLeaderboardTopThreeDrop";
import { WaveSmallLeaderboardDefaultDrop } from "./WaveSmallLeaderboardDefaultDrop";

interface DefaultWaveSmallLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const DefaultWaveSmallLeaderboardDrop: React.FC<
  DefaultWaveSmallLeaderboardDropProps
> = ({ drop, onDropClick }) => {
  return (
    <div className="tw-cursor-pointer" onClick={() => onDropClick(drop)}>
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
