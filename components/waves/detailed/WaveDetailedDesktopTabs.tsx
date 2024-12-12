import React from "react";
import { WaveDetailedView } from "./WaveDetailed";
import { TabToggle } from "../../common/TabToggle";
import Link from "next/link";

interface WaveDetailedDesktopTabsProps {
  readonly activeTab: WaveDetailedView;
  readonly setActiveTab: (tab: WaveDetailedView) => void;
}

export const WaveDetailedDesktopTabs: React.FC<WaveDetailedDesktopTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const options = [
    { key: WaveDetailedView.CHAT, label: "Chat" },
    { key: WaveDetailedView.LEADERBOARD, label: "Leaderboard" },
  ] as const;

  return (
   <div className="tw-flex tw-items-center tw-gap-4">
     <TabToggle
      options={options}
      activeKey={activeTab}
      onSelect={(key) => setActiveTab(key as WaveDetailedView)}
    />
     <div className="tw-flex tw-items-center tw-text-xs tw-text-iron-200">
       <span>
         Rank is in testing mode. Please report bugs in the{" "}
         <Link href="/waves/dc6e0569-e4a3-4122-bc20-ee66c76981f5" className="tw-underline tw-text-white">
           Rank Alpha Debugging
         </Link>{" "}
         wave.
       </span>
     </div>
   </div>
  );
};
