import { FC } from "react";
import { WaveDetailedRightSidebarTab } from "./WaveDetailedRightSidebar";

interface WaveDetailedRightSidebarTabsProps {
  readonly activeTab: WaveDetailedRightSidebarTab;
  readonly setActiveTab: (tab: WaveDetailedRightSidebarTab) => void;
}

export const WaveDetailedRightSidebarTabs: FC<
  WaveDetailedRightSidebarTabsProps
> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="tw-px-4 tw-pt-4">
      <div className="tw-p-0.5 tw-relative tw-ring-1 tw-ring-inset tw-bg-iron-950/90 tw-ring-primary-800/20 tw-inline-flex tw-rounded-lg tw-w-auto tw-gap-x-0.5">
        <div
          className={
            activeTab === WaveDetailedRightSidebarTab.Leaderboard
              ? "tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-primary-500/20 tw-to-primary-600/20"
              : "tw-p-[1px] tw-flex tw-rounded-lg"
          }
        >
          <button
            onClick={() => setActiveTab(WaveDetailedRightSidebarTab.Leaderboard)}
            className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
              activeTab === WaveDetailedRightSidebarTab.Leaderboard
                ? "tw-bg-primary-500/10 tw-text-primary-300"
                : "tw-bg-iron-950 desktop-hover:hover:tw-bg-primary-500/5 tw-text-iron-400 desktop-hover:hover:tw-text-primary-300"
            }`}
          >
            Leaderboard
          </button>
        </div>
        <div
          className={
            activeTab === WaveDetailedRightSidebarTab.Outcomes
              ? "tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-primary-500/20 tw-to-primary-600/20"
              : "tw-p-[1px] tw-flex tw-rounded-lg"
          }
        >
          <button
            onClick={() => setActiveTab(WaveDetailedRightSidebarTab.Outcomes)}
            className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
              activeTab === WaveDetailedRightSidebarTab.Outcomes
                ? "tw-bg-primary-500/10 tw-text-primary-300"
                : "tw-bg-iron-950 desktop-hover:hover:tw-bg-primary-500/5 tw-text-iron-400 desktop-hover:hover:tw-text-primary-300"
            }`}
          >
            Outcome
          </button>
        </div>
      </div>
    </div>
  );
};
