import React from "react";
import { WaveWinnersDrop } from "./WaveWinnersDrop";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { ApiWaveDecisionWinner } from "../../../../generated/models/ObjectSerializer";

interface WaveWinnersDropsProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly winners: ApiWaveDecisionWinner[];
  readonly isLoading?: boolean;
}

export const WaveWinnersDrops: React.FC<WaveWinnersDropsProps> = ({
  wave,
  onDropClick,
  winners,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
        <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
      </div>
    );
  }

  // Empty state handling
  if (!winners.length) {
    return <></>
  }

  return (
    <div className="tw-space-y-3">
      {winners.map((winner) => (
        <WaveWinnersDrop
          key={winner.drop.id}
          winner={winner}
          wave={wave}
          onDropClick={onDropClick}
        />
      ))}
    </div>
  );
};
