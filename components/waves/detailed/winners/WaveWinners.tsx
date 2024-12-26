import React from "react";
import { WaveWinnersPodium } from "./podium/WaveWinnersPodium";
import { WaveWinnersDrops } from "./drops/WaveWinnersDrops";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";

interface WaveWinnersProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveWinners: React.FC<WaveWinnersProps> = ({
  wave,
  onDropClick,
}) => {
  return (
    <div className="tw-space-y-6 tw-mt-8">
      <WaveWinnersPodium wave={wave} onDropClick={onDropClick} />

      <WaveWinnersDrops wave={wave} onDropClick={onDropClick} />
    </div>
  );
};
