"use client";

import React from "react";
import SingleWaveDropDataLoading from "./SingleWaveDropDataLoading";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";
import { SingleWaveDropWrapper } from "./SingleWaveDropWrapper";
import { SingleWaveDropInfoPanel } from "./SingleWaveDropInfoPanel";
import { useSingleWaveDropData } from "./useSingleWaveDropData";
import ContentModerationDropGate from "@/components/content-moderation/ContentModerationDropGate";

interface DefaultSingleWaveDropProps {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

export const DefaultSingleWaveDrop: React.FC<DefaultSingleWaveDropProps> = ({
  drop: initialDrop,
  onClose,
}) => {
  const data = useSingleWaveDropData(initialDrop, onClose);
  const { drop, wave, extendedDrop, voteSummary } = data;
  const {
    winningThreshold,
    winningThresholdMinDurationMs,
    isVotingClosed,
    isVotingControlsLocked,
  } = useApprovalWaveStatus({
    wave,
  });

  if (!extendedDrop || !wave || !drop) {
    return <SingleWaveDropDataLoading data={data} onClose={onClose} />;
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
      <ContentModerationDropGate drop={extendedDrop}>
        <SingleWaveDropInfoPanel
          drop={extendedDrop}
          voteSummary={voteSummary}
          isVotingClosed={isVotingClosed}
          isVotingControlsLocked={isVotingControlsLocked}
          winningThreshold={winningThreshold}
        />
      </ContentModerationDropGate>
    </SingleWaveDropWrapper>
  );
};
