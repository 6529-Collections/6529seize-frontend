import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import BrainMobileLeaderboard from "./BrainMobileLeaderboard";
import { useWaveState, WaveVotingState } from "../../../hooks/useWaveState";
import { WaveWinners } from "../../waves/detailed/winners/WaveWinners";

interface BrainMobileLeaderboardWrapperProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const BrainMobileLeaderboardWrapper: React.FC<
  BrainMobileLeaderboardWrapperProps
> = ({ wave, onDropClick }) => {
  const { votingState } = useWaveState(wave);
  if (votingState === WaveVotingState.ENDED) {
    return <WaveWinners wave={wave} onDropClick={onDropClick} />;
  }
  return <BrainMobileLeaderboard wave={wave} onDropClick={onDropClick} />;
};

export default BrainMobileLeaderboardWrapper;
