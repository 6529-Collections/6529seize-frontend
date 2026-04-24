import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWaveLeaderboardRendererSet } from "../leaderboard/leaderboardRendererRegistry";

interface WaveSmallLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly onDropClick: () => void;
}

export const WaveSmallLeaderboardDrop: React.FC<
  WaveSmallLeaderboardDropProps
> = ({ drop, wave, onDropClick }) => {
  const { SmallLeaderboardDrop } = useWaveLeaderboardRendererSet(wave.id);

  return <SmallLeaderboardDrop drop={drop} onDropClick={onDropClick} />;
};
