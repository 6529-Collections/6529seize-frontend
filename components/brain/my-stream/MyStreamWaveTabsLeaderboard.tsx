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

interface LeaderboardTabOption {
  readonly view: BrainView;
  readonly label: string;
  readonly active: boolean;
}

export function WaveLeaderboardTabOptions({
  wave,
  activeView,
  children,
}: {
  readonly wave: ApiWave;
  readonly activeView: BrainView;
  readonly children: (tabs: readonly LeaderboardTabOption[]) => React.ReactNode;
}) {
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

  return children([
    { view: primaryView, label: primaryLabel, active: isPrimaryActive },
    ...(showWinnersTab
      ? [
          {
            view: BrainView.WINNERS,
            label: winnersLabel,
            active: activeView === BrainView.WINNERS,
          },
        ]
      : []),
  ]);
}

function MyStreamWaveTabsLeaderboard({
  wave,
  activeView,
  onViewChange,
  registerTabRef,
  renderAfterLeaderboard,
}: MyStreamWaveTabsLeaderboardProps) {
  return (
    <WaveLeaderboardTabOptions wave={wave} activeView={activeView}>
      {(tabs) =>
        tabs.map(({ view, label, active }, index) => (
          <React.Fragment key={view}>
            <TabButton
              type="button"
              ref={(el) => {
                registerTabRef?.(view, el);
              }}
              onClick={() => onViewChange(view)}
              aria-current={active ? "true" : undefined}
              className={getTabButtonClassName(active)}
            >
              <span className={getTabTextClassName({ isActive: active })}>
                {label}
              </span>
            </TabButton>
            {index === 0 && renderAfterLeaderboard}
          </React.Fragment>
        ))
      }
    </WaveLeaderboardTabOptions>
  );
}

export default MyStreamWaveTabsLeaderboard;
