import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { useWave } from "@/hooks/useWave";
import { DefaultWaveWinnersDrop } from "./DefaultWaveWinnerDrop";
import { MemesWaveWinnersDrop } from "./MemesWaveWinnerDrop";
import type { DropContentPresentation } from "@/components/waves/drops/dropContentPresentation";

interface WaveWinnersDropProps {
  readonly winner: ApiWaveDecisionWinner;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly isApprovalWave?: boolean | undefined;
  readonly contentPresentation?: DropContentPresentation | undefined;
  readonly outcomesVisible?: boolean | undefined;
}

export const WaveWinnersDrop: React.FC<WaveWinnersDropProps> = ({
  winner,
  wave,
  onDropClick,
  isApprovalWave = false,
  contentPresentation = "default",
  outcomesVisible = true,
}) => {
  const { isMemesWave } = useWave(wave);

  if (isMemesWave) {
    return (
      <MemesWaveWinnersDrop
        winner={winner}
        wave={wave}
        onDropClick={onDropClick}
      />
    );
  }

  return (
    <DefaultWaveWinnersDrop
      winner={winner}
      onDropClick={onDropClick}
      isApprovalWave={isApprovalWave}
      contentPresentation={contentPresentation}
      outcomesVisible={outcomesVisible}
    />
  );
};
