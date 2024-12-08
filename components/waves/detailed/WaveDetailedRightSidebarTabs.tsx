import { FC } from "react";
import { TabToggle } from "../../common/TabToggle";
import { WaveDetailedRightSidebarTab } from "./WaveDetailedRightSidebar";

interface WaveDetailedRightSidebarTabsProps {
  readonly activeTab: WaveDetailedRightSidebarTab;
  readonly setActiveTab: (tab: WaveDetailedRightSidebarTab) => void;
}

export const WaveDetailedRightSidebarTabs: FC<WaveDetailedRightSidebarTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabOptions = [
    { key: WaveDetailedRightSidebarTab.Leaderboard, label: "Leaderboard" },
    { key: WaveDetailedRightSidebarTab.Outcomes, label: "Outcome" },
  ] as const;

  return (
    <div className="tw-px-4 tw-pt-4">
      <TabToggle
        options={tabOptions}
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key as WaveDetailedRightSidebarTab)}
      />
    </div>
  );
};
