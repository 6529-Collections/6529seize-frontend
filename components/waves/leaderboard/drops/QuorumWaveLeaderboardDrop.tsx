"use client";

import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DefaultWaveLeaderboardDrop } from "./DefaultWaveLeaderboardDrop";

interface QuorumWaveLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
}

export const QuorumWaveLeaderboardDrop: React.FC<
  QuorumWaveLeaderboardDropProps
> = ({
  drop,
  onDropClick,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed,
  isVotingControlsLocked,
}) => {
  return (
    <DefaultWaveLeaderboardDrop
      drop={drop}
      onDropClick={onDropClick}
      winningThreshold={winningThreshold}
      winningThresholdMinDurationMs={winningThresholdMinDurationMs}
      isVotingClosed={isVotingClosed}
      isVotingControlsLocked={isVotingControlsLocked}
      contentPresentation="quorumCompact"
    />
  );
};
