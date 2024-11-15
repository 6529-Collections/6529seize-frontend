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
      <div className="tw-p-0.5 tw-relative tw-ring-1 tw-ring-inset tw-bg-iron-950 tw-ring-iron-700 tw-inline-flex tw-rounded-lg tw-gap-x-0.5">
        <div
          className={
            activeTab === WaveDetailedRightSidebarTab.Leaderboard
              ? "tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-iron-700 tw-to-iron-800 tw-flex-1"
              : "tw-p-[1px] tw-flex tw-rounded-lg tw-flex-1"
          }
        >
          <button
            onClick={() =>
              setActiveTab(WaveDetailedRightSidebarTab.Leaderboard)
            }
            className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
              activeTab === WaveDetailedRightSidebarTab.Leaderboard
                ? "tw-bg-iron-800 tw-text-iron-100"
                : "tw-bg-iron-950 hover:tw-bg-iron-900 tw-text-iron-500 hover:tw-text-iron-100"
            }`}
          >
            Leaderboard
          </button>
        </div>
        <div
          className={
            activeTab === WaveDetailedRightSidebarTab.Outcomes
              ? "tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-iron-700 tw-to-iron-800 tw-flex-1"
              : "tw-p-[1px] tw-flex tw-rounded-lg tw-flex-1"
          }
        >
          <button
            onClick={() => setActiveTab(WaveDetailedRightSidebarTab.Outcomes)}
            className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
              activeTab === WaveDetailedRightSidebarTab.Outcomes
                ? "tw-bg-iron-800 tw-text-iron-100"
                : "tw-bg-iron-950 hover:tw-bg-iron-900 tw-text-iron-500 hover:tw-text-iron-100"
            }`}
          >
            Outcome
          </button>
        </div>
      </div>
    </div>
  );
};
