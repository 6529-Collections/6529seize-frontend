import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ApiWaveDecisionWinner } from "../../../../generated/models/ApiWaveDecisionWinner";
import { useWave } from "../../../../hooks/useWave";
import { DefaultWaveWinnersDrop } from "./DefaultWaveWinnerDrop";
import { MemesWaveWinnersDrop } from "./MemesWaveWinnerDrop";
interface WaveWinnersDropProps {
  readonly winner: ApiWaveDecisionWinner;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveWinnersDrop: React.FC<WaveWinnersDropProps> = ({
  winner,
  wave,
  onDropClick,
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
    />
  );
};
