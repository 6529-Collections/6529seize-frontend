"use client";

import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";
import { SingleWaveDropWrapper } from "./SingleWaveDropWrapper";
import { SingleWaveDropInfoPanel } from "./SingleWaveDropInfoPanel";
import { useSingleWaveDropData } from "./useSingleWaveDropData";

interface DefaultSingleWaveDropProps {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

export const DefaultSingleWaveDrop: React.FC<DefaultSingleWaveDropProps> = ({
  drop: initialDrop,
  onClose,
}) => {
  const { drop, wave, extendedDrop } = useSingleWaveDropData(
    initialDrop,
    onClose
  );
  const {
    winningThreshold,
    winningThresholdMinDurationMs,
    isVotingClosed,
    isVotingControlsLocked,
  } = useApprovalWaveStatus({
    wave,
  });

  if (!extendedDrop || !wave || !drop) {
    return null;
  }

  return (
    <SingleWaveDropWrapper
      drop={drop}
      wave={wave}
      onClose={onClose}
      winningThreshold={winningThreshold}
      winningThresholdMinDurationMs={winningThresholdMinDurationMs}
      isVotingClosed={isVotingClosed}
      isVotingControlsLocked={isVotingControlsLocked}
    >
      <SingleWaveDropInfoPanel
        drop={extendedDrop}
        isVotingClosed={isVotingClosed}
        isVotingControlsLocked={isVotingControlsLocked}
        winningThreshold={winningThreshold}
      />
    </SingleWaveDropWrapper>
  );
};
