import React from "react";
import { WaveWinnersHeader } from "./WaveWinnersHeader";
import { WaveWinnersPodium } from "./podium/WaveWinnersPodium";
import { WaveWinnersDrops } from "./drops/WaveWinnersDrops";

interface WaveWinnersProps {
  readonly wave: any;
  readonly onDropClick: (drop: any) => void;
}

export const WaveWinners: React.FC<WaveWinnersProps> = ({
  wave,
  onDropClick,
}) => {
  return (
    <div className="tw-space-y-6 tw-mt-6">
      <div className="tw-bg-iron-950 tw-px-6 tw-pt-6 tw-rounded-xl">
        <WaveWinnersHeader wave={wave} />
        <WaveWinnersPodium wave={wave} onDropClick={onDropClick} />
      </div>
      <WaveWinnersDrops wave={wave} onDropClick={onDropClick} />
    </div>
  );
};
