import React from "react";

import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useWave } from "@/hooks/useWave";

import { DefaultWaveSmallLeaderboardDrop } from "./DefaultWaveSmallLeaderboardDrop";
import { MemesWaveSmallLeaderboardDrop } from "./MemesWaveSmallLeaderboardDrop";

interface WaveSmallLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly onDropClick: () => void;
}

export const WaveSmallLeaderboardDrop: React.FC<
  WaveSmallLeaderboardDropProps
> = ({ drop, wave, onDropClick }) => {
  const { isMemesWave } = useWave(wave);
  if (isMemesWave) {
    return (
      <MemesWaveSmallLeaderboardDrop drop={drop} onDropClick={onDropClick} />
    );
  }
  return (
    <DefaultWaveSmallLeaderboardDrop drop={drop} onDropClick={onDropClick} />
  );
};
