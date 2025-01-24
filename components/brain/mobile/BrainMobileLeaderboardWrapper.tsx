import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import BrainMobileLeaderboard from "./BrainMobileLeaderboard";
import { useWaveState, WaveVotingState } from "../../../hooks/useWaveState";
import { WaveWinners } from "../../waves/detailed/winners/WaveWinners";
import useCapacitor from "../../../hooks/useCapacitor";
import { ExtendedDrop } from "../../../helpers/waves/wave-drops.helpers";

interface BrainMobileLeaderboardWrapperProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const BrainMobileLeaderboardWrapper: React.FC<
  BrainMobileLeaderboardWrapperProps
> = ({ wave, onDropClick }) => {
  const { votingState } = useWaveState(wave);
  const capacitor = useCapacitor();

  const contentHeight = capacitor.isCapacitor
    ? "tw-h-[calc(100vh-20rem)]"
    : "tw-h-[calc(100vh-10rem)]";

  if (votingState === WaveVotingState.ENDED) {
    return (
      <div
        className={`tw-overflow-y-auto ${contentHeight} tw-max-h-full no-scrollbar tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-700`}
      >
        <WaveWinners wave={wave} onDropClick={onDropClick} />
      </div>
    );
  }
  return <BrainMobileLeaderboard wave={wave} />;
};

export default BrainMobileLeaderboardWrapper;
