import React from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useWaveLeaderboardRendererSet } from "../leaderboardRendererRegistry";

interface WaveLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly onSourceDropDeleted?: (() => void) | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
}

export const WaveLeaderboardDrop: React.FC<WaveLeaderboardDropProps> = ({
  drop,
  wave,
  onDropClick,
  onSourceDropDeleted,
  isVotingClosed = false,
  isVotingControlsLocked = false,
}) => {
  const { LeaderboardDrop } = useWaveLeaderboardRendererSet(wave.id);
  const winningThreshold =
    wave.wave.type === ApiWaveType.Approve ? wave.wave.winning_threshold : null;
  const winningThresholdMinDurationMs =
    wave.wave.type === ApiWaveType.Approve
      ? wave.wave.winning_threshold_min_duration_ms
      : null;

  return (
    <LeaderboardDrop
      drop={drop}
      wave={wave}
      onDropClick={onDropClick}
      onSourceDropDeleted={onSourceDropDeleted}
      isVotingClosed={isVotingClosed}
      isVotingControlsLocked={isVotingControlsLocked}
      winningThreshold={winningThreshold}
      winningThresholdMinDurationMs={winningThresholdMinDurationMs}
    />
  );
};
