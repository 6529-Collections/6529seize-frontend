import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiWave } from "@/generated/models/ObjectSerializer";
import { MemesLeaderboardDrop } from "@/components/memes/drops/MemesLeaderboardDrop";
import { useWave } from "@/hooks/useWave";
import { DefaultWaveLeaderboardDrop } from "./DefaultWaveLeaderboardDrop";

interface WaveLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly onSourceDropDeleted?: (() => void) | undefined;
}

export const WaveLeaderboardDrop: React.FC<WaveLeaderboardDropProps> = ({
  drop,
  wave,
  onDropClick,
  onSourceDropDeleted,
}) => {
  const { isMemesWave } = useWave(wave);
  if (isMemesWave) {
    return (
      <MemesLeaderboardDrop
        drop={drop}
        wave={wave}
        onDropClick={onDropClick}
        onSourceDropDeleted={onSourceDropDeleted}
      />
    );
  }
  return <DefaultWaveLeaderboardDrop drop={drop} onDropClick={onDropClick} />;
};
