import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { WaveWinnersDrops } from "./drops/WaveWinnersDrops";
import { WaveWinnersPodium } from "./podium/WaveWinnersPodium";
import { WaveRollingWinners } from "./WaveRollingWinners";

interface WaveWinnersProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveWinners: React.FC<WaveWinnersProps> = ({
  wave,
  onDropClick,
}) => {
  return (
    <div className="tw-space-y-4 lg:tw-space-y-6 tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
      <WaveRollingWinners 
        wave={wave} 
        onDropClick={onDropClick} 
      />
     {/*  <WaveWinnersPodium wave={wave} onDropClick={onDropClick} />
      <WaveWinnersDrops wave={wave} onDropClick={onDropClick} /> */}
    </div>
  );
};
