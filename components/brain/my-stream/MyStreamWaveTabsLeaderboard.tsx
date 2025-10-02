import React from "react";
import { ApiWave } from "@/generated/models/ApiWave";
import { BrainView } from "../BrainMobile";
import { useWaveTimers } from "@/hooks/useWaveTimers";

type RegisterTabRef = (view: BrainView, el: HTMLButtonElement | null) => void;

interface MyStreamWaveTabsLeaderboardProps {
  readonly wave: ApiWave;
  readonly activeView: BrainView;
  readonly onViewChange: (view: BrainView) => void;
  readonly registerTabRef?: RegisterTabRef;
}

const MyStreamWaveTabsLeaderboard: React.FC<
  MyStreamWaveTabsLeaderboardProps
> = ({ wave, activeView, onViewChange, registerTabRef }) => {
  const {
    voting: { isCompleted },
    decisions: { firstDecisionDone },
  } = useWaveTimers(wave);

  // Leaderboard tab classes
  const leaderboardButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-7 tw-rounded-lg ${
    activeView === BrainView.LEADERBOARD ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;
  const leaderboardButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === BrainView.LEADERBOARD
      ? "tw-text-iron-300"
      : "tw-text-iron-400"
  }`;

  // Winners tab classes
  const winnersButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-7 tw-rounded-lg ${
    activeView === BrainView.WINNERS ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;
  const winnersButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === BrainView.WINNERS ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;

  return (
    <>
      {/* Show Leaderboard tab always except when voting has ended */}
      {!isCompleted && (
        <button
          ref={el => {
            registerTabRef?.(BrainView.LEADERBOARD, el);
          }}
          onClick={() => onViewChange(BrainView.LEADERBOARD)}
          className={leaderboardButtonClasses}
        >
          <span className={leaderboardButtonTextClasses}>Leaderboard</span>
        </button>
      )}
      {/* Show Winners tab if first decision has passed */}
      {firstDecisionDone && (
        <button
          ref={el => {
            registerTabRef?.(BrainView.WINNERS, el);
          }}
          onClick={() => onViewChange(BrainView.WINNERS)}
          className={winnersButtonClasses}
        >
          <span className={winnersButtonTextClasses}>Winners</span>
        </button>
      )}
    </>
  );
};

export default MyStreamWaveTabsLeaderboard;
