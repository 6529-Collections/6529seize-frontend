import React from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { BrainView } from "../mobile/brainMobileViews";
import { useWaveTimers } from "@/hooks/useWaveTimers";

type RegisterTabRef = (view: BrainView, el: HTMLButtonElement | null) => void;

interface MyStreamWaveTabsLeaderboardProps {
  readonly wave: ApiWave;
  readonly activeView: BrainView;
  readonly onViewChange: (view: BrainView) => void;
  readonly registerTabRef?: RegisterTabRef | undefined;
  readonly renderAfterLeaderboard?: React.ReactNode;
}

const MyStreamWaveTabsLeaderboard: React.FC<
  MyStreamWaveTabsLeaderboardProps
> = ({
  wave,
  activeView,
  onViewChange,
  registerTabRef,
  renderAfterLeaderboard,
}) => {
  const {
    voting: { isCompleted },
    decisions: { firstDecisionDone },
  } = useWaveTimers(wave);
  const primaryView = isCompleted
    ? BrainView.SUBMISSIONS
    : BrainView.LEADERBOARD;
  const primaryLabel = isCompleted ? "Submissions" : "Leaderboard";

  // Leaderboard tab classes
  const leaderboardButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-7 tw-rounded-lg ${
    activeView === primaryView ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;
  const leaderboardButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === primaryView ? "tw-text-iron-300" : "tw-text-iron-400"
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
      <button
        ref={(el) => {
          registerTabRef?.(primaryView, el);
        }}
        onClick={() => onViewChange(primaryView)}
        className={leaderboardButtonClasses}
      >
        <span className={leaderboardButtonTextClasses}>{primaryLabel}</span>
      </button>
      {renderAfterLeaderboard}
      {/* Show Winners tab if first decision has passed */}
      {firstDecisionDone && (
        <button
          ref={(el) => {
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
