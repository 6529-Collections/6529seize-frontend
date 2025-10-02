import React from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ApiWave } from "@/generated/models/ObjectSerializer";
import { MemesLeaderboardDrop } from "@/components/memes/drops/MemesLeaderboardDrop";
import { useWave } from "@/hooks/useWave";
import { DefaultWaveLeaderboardDrop } from "./DefaultWaveLeaderboardDrop";

interface WaveLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveLeaderboardDrop: React.FC<WaveLeaderboardDropProps> = ({
  drop,
  wave,
  onDropClick,
}) => {
  const { isMemesWave } = useWave(wave);
  if (isMemesWave) {
    return <MemesLeaderboardDrop drop={drop} onDropClick={onDropClick} />;
  }
  return (
    <DefaultWaveLeaderboardDrop
      drop={drop}
      wave={wave}
      onDropClick={onDropClick}
    />
  );
};
