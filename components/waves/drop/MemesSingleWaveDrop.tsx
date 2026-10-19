"use client";

import React from "react";
import SingleWaveDropLoading from "./SingleWaveDropLoading";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";
import { useWaveOutcomeVisibility } from "@/hooks/waves/useWaveMetadata";
import { MemesSingleWaveDropInfoPanel } from "./MemesSingleWaveDropInfoPanel";
import { SingleWaveDropWrapper } from "./SingleWaveDropWrapper";
import { useSingleWaveDropData } from "./useSingleWaveDropData";
import ContentModerationDropGate from "@/components/content-moderation/ContentModerationDropGate";

interface MemesSingleWaveDropProps {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

export const MemesSingleWaveDrop: React.FC<MemesSingleWaveDropProps> = ({
  drop: initialDrop,
  onClose,
}) => {
  const { drop, wave, extendedDrop, voteSummary, isWaveError, refetchWave } =
    useSingleWaveDropData(initialDrop, onClose);
  const outcomesVisible = useWaveOutcomeVisibility(wave);
  const {
    winningThreshold,
    winningThresholdMinDurationMs,
    isVotingClosed,
    isVotingControlsLocked,
  } = useApprovalWaveStatus({
    wave,
  });

  if (!extendedDrop || !wave || !drop) {
    return (
      <SingleWaveDropLoading
        onClose={onClose}
        isError={isWaveError}
        onRetry={() => {
          void refetchWave();
        }}
      />
    );
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
        <MemesSingleWaveDropInfoPanel
          drop={extendedDrop}
          voteSummary={voteSummary}
          wave={wave}
          onClose={onClose}
          isVotingClosed={isVotingClosed}
          isVotingControlsLocked={isVotingControlsLocked}
          outcomesVisible={outcomesVisible}
        />
      </ContentModerationDropGate>
    </SingleWaveDropWrapper>
  );
};
