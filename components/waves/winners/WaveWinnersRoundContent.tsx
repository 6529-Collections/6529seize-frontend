import React from "react";
import { WaveWinnersPodium } from "./podium/WaveWinnersPodium";
import { WaveWinnersDrops } from "./drops/WaveWinnersDrops";
import { WaveWinnersRoundEmpty } from "./WaveWinnersRoundEmpty";
import { ApiWaveDecisionWinner } from "../../../generated/models/ApiWaveDecisionWinner";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";

interface WaveWinnersRoundContentProps {
  readonly winners: ApiWaveDecisionWinner[];
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly wave: ApiWave;
  readonly isLoading?: boolean;
}

export const WaveWinnersRoundContent: React.FC<WaveWinnersRoundContentProps> = ({
  winners,
  onDropClick,
  wave,
  isLoading = false,
}) => {
  if (winners.length === 0) {
    return <WaveWinnersRoundEmpty />;
  }
  
  return (
    <>
      <WaveWinnersPodium
        onDropClick={onDropClick}
        winners={winners}
        isLoading={isLoading}
      />
      <WaveWinnersDrops
        onDropClick={onDropClick}
        winners={winners}
        isLoading={isLoading}
        wave={wave}
      />
    </>
  );
};