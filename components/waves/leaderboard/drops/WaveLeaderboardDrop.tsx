import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWaveLeaderboardRendererSet } from "../leaderboardRendererRegistry";

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
  const { LeaderboardDrop } = useWaveLeaderboardRendererSet(wave.id);

  return <LeaderboardDrop drop={drop} wave={wave} onDropClick={onDropClick} />;
};
