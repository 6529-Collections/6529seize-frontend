import React from "react";
import { WaveDetailedView } from "./WaveDetailed";
import { TabToggle } from "../../common/TabToggle";

interface WaveDetailedDesktopTabsProps {
  readonly activeTab: WaveDetailedView;
  readonly setActiveTab: (tab: WaveDetailedView) => void;
}

export const WaveDetailedDesktopTabs: React.FC<
  WaveDetailedDesktopTabsProps
> = ({ activeTab, setActiveTab }) => {
  const options = [
    { key: WaveDetailedView.CHAT, label: "Chat" },
    { key: WaveDetailedView.LEADERBOARD, label: "Leaderboard" },
    { key: WaveDetailedView.OUTCOME, label: "Outcome" },
  ] as const;

  return (
    <div className="tw-flex tw-items-center tw-gap-4 tw-justify-between tw-w-full">
      <TabToggle
        options={options}
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key as WaveDetailedView)}
      />

      {/* {activeTab === WaveDetailedView.CHAT && (
        <div className="tw-pr-4">
          <FilterDrops />
        </div>
      )} */}
    </div>
  );
};
