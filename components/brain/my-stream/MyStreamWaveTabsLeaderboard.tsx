import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { BrainView } from "../BrainMobile";
import { useWaveState, WaveVotingState } from "../../../hooks/useWaveState";

interface MyStreamWaveTabsLeaderboardProps {
  readonly wave: ApiWave;
  readonly activeView: BrainView;
  readonly onViewChange: (view: BrainView) => void;
}

export const MyStreamWaveTabsLeaderboard: React.FC<MyStreamWaveTabsLeaderboardProps> = ({
  wave,
  activeView,
  onViewChange,
}) => {
  const { votingState } = useWaveState(wave);
  const leaderboardButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-lg ${
    activeView === BrainView.LEADERBOARD ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;
  const leaderboardButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === BrainView.LEADERBOARD ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;
  return (
    <button
    onClick={() => onViewChange(BrainView.LEADERBOARD)}
    className={leaderboardButtonClasses}
  >
    <span className={leaderboardButtonTextClasses}>
      {votingState === WaveVotingState.ENDED ? "Winners" : "Leaderboard"}
    </span>
  </button>
  );
};

export default MyStreamWaveTabsLeaderboard;
