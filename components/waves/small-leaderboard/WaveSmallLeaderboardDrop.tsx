import React from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ApiWave } from "@/generated/models/ApiWave";
import { useWave } from "@/hooks/useWave";
import { MemesWaveSmallLeaderboardDrop } from "./MemesWaveSmallLeaderboardDrop";
import { DefaultWaveSmallLeaderboardDrop } from "./DefaultWaveSmallLeaderboardDrop";

interface WaveSmallLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveSmallLeaderboardDrop: React.FC<
  WaveSmallLeaderboardDropProps
> = ({ drop, wave, onDropClick }) => {
  const { isMemesWave } = useWave(wave);
  if (isMemesWave) {
    return (
      <MemesWaveSmallLeaderboardDrop
        drop={drop}
        onDropClick={onDropClick}
      />
    );
  } else {
    return (
      <DefaultWaveSmallLeaderboardDrop
        drop={drop}
        onDropClick={onDropClick}
      />
    );
  }
};
