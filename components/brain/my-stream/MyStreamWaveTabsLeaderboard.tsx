import React from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { BrainView } from "../mobile/brainMobileViews";
import { useWaveTimers } from "@/hooks/useWaveTimers";
import { useApproveWaveCustomTabLabels } from "@/hooks/waves/useWaveMetadata";
import { useCompetitionNavigation } from "@/contexts/CompetitionNavigationContext";
import TabButton from "@/components/common/TabButton";
import {
  getTabButtonClassName,
  getTabTextClassName,
} from "../mobile/brainMobileTabStyles";

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
  const { flat, nativeCompetition } = useCompetitionNavigation();
  const {
    voting: { isCompleted },
    decisions: { firstDecisionDone },
  } = useWaveTimers(wave);
  const isApproveWave = wave.wave.type === ApiWaveType.Approve;
  const approveLabels = useApproveWaveCustomTabLabels(wave);
  const primaryView =
    isCompleted && !isApproveWave
      ? BrainView.SUBMISSIONS
      : BrainView.LEADERBOARD;
  const isPrimaryActive =
    activeView === primaryView ||
    (flat && !nativeCompetition && activeView === BrainView.LEADERBOARD);
  let primaryLabel: string;
  if (isApproveWave) {
    primaryLabel = approveLabels.approvals;
  } else if (isCompleted) {
    primaryLabel = "Submissions";
  } else {
    primaryLabel = "Leaderboard";
  }
  const showWinnersTab = isApproveWave || firstDecisionDone;
  const winnersLabel = isApproveWave ? approveLabels.approved : "Winners";

  return (
    <>
      <TabButton
        type="button"
        ref={(el) => {
          registerTabRef?.(primaryView, el);
        }}
        onClick={() => onViewChange(primaryView)}
        aria-current={isPrimaryActive ? "true" : undefined}
        className={getTabButtonClassName(isPrimaryActive)}
      >
        <span className={getTabTextClassName({ isActive: isPrimaryActive })}>
          {primaryLabel}
        </span>
      </TabButton>
      {renderAfterLeaderboard}
      {showWinnersTab && (
        <TabButton
          type="button"
          ref={(el) => {
            registerTabRef?.(BrainView.WINNERS, el);
          }}
          onClick={() => onViewChange(BrainView.WINNERS)}
          aria-current={activeView === BrainView.WINNERS ? "true" : undefined}
          className={getTabButtonClassName(activeView === BrainView.WINNERS)}
        >
          <span
            className={getTabTextClassName({
              isActive: activeView === BrainView.WINNERS,
            })}
          >
            {winnersLabel}
          </span>
        </TabButton>
      )}
    </>
  );
};

export default MyStreamWaveTabsLeaderboard;
