"use client";

import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";
import { MemesSingleWaveDropInfoPanel } from "./MemesSingleWaveDropInfoPanel";
import { SingleWaveDropWrapper } from "./SingleWaveDropWrapper";
import { useSingleWaveDropData } from "./useSingleWaveDropData";

interface MemesSingleWaveDropProps {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

export const MemesSingleWaveDrop: React.FC<MemesSingleWaveDropProps> = ({
  drop: initialDrop,
  onClose,
}) => {
  const { drop, wave, extendedDrop } = useSingleWaveDropData(
    initialDrop,
    onClose
  );
  const { winningThreshold, isVotingClosed, isVotingControlsLocked } =
    useApprovalWaveStatus({
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
      isVotingClosed={isVotingClosed}
      isVotingControlsLocked={isVotingControlsLocked}
    >
      <MemesSingleWaveDropInfoPanel
        drop={extendedDrop}
        wave={wave}
        onClose={onClose}
        isVotingClosed={isVotingClosed}
        isVotingControlsLocked={isVotingControlsLocked}
      />
    </SingleWaveDropWrapper>
  );
};
