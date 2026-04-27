import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiWave } from "@/generated/models/ObjectSerializer";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { MemesLeaderboardDrop } from "@/components/memes/drops/MemesLeaderboardDrop";
import { useWave } from "@/hooks/useWave";
import { DefaultWaveLeaderboardDrop } from "./DefaultWaveLeaderboardDrop";

interface WaveLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly onSourceDropDeleted?: (() => void) | undefined;
  readonly isVotingClosed?: boolean | undefined;
}

export const WaveLeaderboardDrop: React.FC<WaveLeaderboardDropProps> = ({
  drop,
  wave,
  onDropClick,
  onSourceDropDeleted,
  isVotingClosed = false,
}) => {
  const { isMemesWave } = useWave(wave);
  const winningThreshold =
    wave.wave.type === ApiWaveType.Approve ? wave.wave.winning_threshold : null;

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
  return (
    <DefaultWaveLeaderboardDrop
      drop={drop}
      onDropClick={onDropClick}
      winningThreshold={winningThreshold}
      isVotingClosed={isVotingClosed}
    />
  );
};
