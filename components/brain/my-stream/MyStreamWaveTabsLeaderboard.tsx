import React from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { BrainView } from "../mobile/brainMobileViews";
import { useWaveTimers } from "@/hooks/useWaveTimers";
import { useApproveWaveCustomTabLabels } from "@/hooks/waves/useWaveMetadata";

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
  const isApproveWave = wave.wave.type === ApiWaveType.Approve;
  const approveLabels = useApproveWaveCustomTabLabels(wave);
  const primaryView =
    isCompleted && !isApproveWave
      ? BrainView.SUBMISSIONS
      : BrainView.LEADERBOARD;
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
  const baseButtonClasses =
    "tw-flex tw-min-h-10 tw-shrink-0 tw-items-center tw-justify-center tw-gap-1 tw-rounded-md tw-border-0 tw-px-3 tw-py-2 tw-no-underline tw-transition-colors tw-duration-150 tw-ease-out motion-reduce:tw-transition-none focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";
  const getButtonStateClasses = (isActive: boolean) =>
    `${baseButtonClasses} ${isActive ? "tw-bg-iron-800" : "tw-bg-iron-950"}`;
  const getButtonTextClasses = (isActive: boolean) =>
    `tw-max-w-36 tw-truncate tw-whitespace-nowrap tw-text-xs tw-font-semibold sm:tw-max-w-44 sm:tw-text-sm ${isActive ? "tw-text-iron-300" : "tw-text-iron-400"}`;

  return (
    <>
      <button
        type="button"
        ref={(el) => {
          registerTabRef?.(primaryView, el);
        }}
        onClick={() => onViewChange(primaryView)}
        aria-current={activeView === primaryView ? "true" : undefined}
        className={getButtonStateClasses(activeView === primaryView)}
      >
        <span className={getButtonTextClasses(activeView === primaryView)}>
          {primaryLabel}
        </span>
      </button>
      {renderAfterLeaderboard}
      {showWinnersTab && (
        <button
          type="button"
          ref={(el) => {
            registerTabRef?.(BrainView.WINNERS, el);
          }}
          onClick={() => onViewChange(BrainView.WINNERS)}
          aria-current={
            activeView === BrainView.WINNERS ? "true" : undefined
          }
          className={getButtonStateClasses(activeView === BrainView.WINNERS)}
        >
          <span className={getButtonTextClasses(activeView === BrainView.WINNERS)}>
            {winnersLabel}
          </span>
        </button>
      )}
    </>
  );
};

export default MyStreamWaveTabsLeaderboard;
