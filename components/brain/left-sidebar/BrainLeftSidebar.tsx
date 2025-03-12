import React, { useMemo } from "react";
import { BrainLeftSidebarViewChange } from "./BrainLeftSidebarViewChange";
import BrainLeftSidebarSearchWave from "./search-wave/BrainLeftSidebarSearchWave";
import BrainLeftSidebarWaves from "./waves/BrainLeftSidebarWaves";
import { TabToggle } from "../../common/TabToggle";
import { useContentTab } from "../ContentTabContext";
import { MyStreamWaveTab } from "../../../types/waves.types";

interface BrainLeftSidebarProps {
  readonly activeWaveId: string | null;
}

const BrainLeftSidebar: React.FC<BrainLeftSidebarProps> = ({
  activeWaveId,
}) => {
  // Get content tab state from context
  const { activeContentTab, setActiveContentTab, availableTabs } = useContentTab();

  // Map enum values to label names
  const tabLabels: Record<MyStreamWaveTab, string> = {
    [MyStreamWaveTab.CHAT]: "Chat",
    [MyStreamWaveTab.LEADERBOARD]: "Leaderboard",
    [MyStreamWaveTab.WINNERS]: "Winners",
    [MyStreamWaveTab.OUTCOME]: "Outcome",
  };

  // Generate options based on available tabs
  const contentFilterOptions = useMemo(() => {
    return availableTabs.map(tab => ({
      key: tab,
      label: tabLabels[tab]
    }));
  }, [availableTabs]);

  return (
    <div className="tw-flex-shrink-0 tw-relative tw-flex tw-flex-col h-screen lg:tw-h-[calc(100vh-5.5rem)] tw-overflow-y-auto lg:tw-w-80 tw-w-full no-scrollbar">
      <div className="tw-pt-4 tw-pb-4 tw-flex-1 tw-px-4 md:tw-px-2 lg:tw-px-0 tw-gap-y-4 tw-flex-col tw-flex">
        <BrainLeftSidebarViewChange />

        {activeWaveId && contentFilterOptions.length > 1 && (
          <div className="tw-w-full tw-hidden">
            <TabToggle
              options={contentFilterOptions}
              activeKey={activeContentTab}
              onSelect={(key) => setActiveContentTab(key as MyStreamWaveTab)}
              fullWidth={true}
            />
          </div>
        )}

        <BrainLeftSidebarSearchWave />
        <BrainLeftSidebarWaves activeWaveId={activeWaveId} />
      </div>
    </div>
  );
};

export default BrainLeftSidebar;
