import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import BrainMobileLeaderboard from "./BrainMobileLeaderboard";
import { WaveWinners } from "../../waves/winners/WaveWinners";
import useCapacitor from "../../../hooks/useCapacitor";
import { ExtendedDrop } from "../../../helpers/waves/wave-drops.helpers";
import { useWaveTimers } from "../../../hooks/useWaveTimers";
interface BrainMobileLeaderboardWrapperProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const BrainMobileLeaderboardWrapper: React.FC<
  BrainMobileLeaderboardWrapperProps
> = ({ wave, onDropClick }) => {
  const { voting: { isCompleted } } = useWaveTimers(wave);
  const capacitor = useCapacitor();

  const contentHeight = capacitor.isCapacitor
    ? "tw-h-[calc(100vh-20rem)]"
    : "tw-h-[calc(100vh-10rem)]";

  if (isCompleted) {
    return (
      <div
        className={`tw-overflow-y-auto ${contentHeight} tw-max-h-full no-scrollbar tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-600`}
      >
        <WaveWinners wave={wave} onDropClick={onDropClick} />
      </div>
    );
  }
  return <BrainMobileLeaderboard wave={wave} />;
};

export default BrainMobileLeaderboardWrapper;
