import React, { useState } from "react";
import { motion } from "framer-motion";
import { WaveLeaderboardRightSidebarTabs } from "./WaveLeaderboardRightSidebarTabs";
import { WaveLeaderboardRightSidebarOpenToggle } from "./WaveLeaderboardRightSidebarOpenToggle";
import { WaveLeaderboardRightSidebarVoters } from "./WaveLeaderboardRightSidebarVoters";
import { WaveLeaderboardRightSidebarActivityLogs } from "./WaveLeaderboardRightSidebarActivityLogs";
import { ApiWave } from "../../../../../generated/models/ApiWave";

interface WaveLeaderboardRightSidebarProps {
  readonly isOpen: boolean;
  readonly wave: ApiWave;
  readonly onToggle: () => void;
}

export enum WaveLeaderboardRightSidebarTab {
  VOTERS = "VOTERS",
  ACTIVITY = "ACTIVITY",
}

const WaveLeaderboardRightSidebar: React.FC<
  WaveLeaderboardRightSidebarProps
> = ({ isOpen, onToggle, wave }) => {
  const [activeTab, setActiveTab] = useState<WaveLeaderboardRightSidebarTab>(
    WaveLeaderboardRightSidebarTab.VOTERS
  );

  const components: Record<WaveLeaderboardRightSidebarTab, React.ReactNode> = {
    [WaveLeaderboardRightSidebarTab.VOTERS]: (
      <WaveLeaderboardRightSidebarVoters wave={wave} />
    ),
    [WaveLeaderboardRightSidebarTab.ACTIVITY]: (
      <WaveLeaderboardRightSidebarActivityLogs wave={wave} />
    ),
  };

  return (
    <motion.div
      className="tw-fixed tw-right-0 tw-top-0 tw-h-screen tw-z-40 tw-bg-iron-950 tw-flex tw-flex-col tw-w-full lg:tw-w-[20.5rem] tw-border-l tw-border-solid tw-border-y-0 tw-border-r-0 tw-border-iron-800"
      initial={false}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <WaveLeaderboardRightSidebarOpenToggle
        isOpen={isOpen}
        onToggle={onToggle}
      />
      <div className="tw-pt-[5.6rem] xl:tw-pt-[6.25rem] tw-text-iron-500 tw-text-sm tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-h-full">
        <WaveLeaderboardRightSidebarTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <motion.div
          className="tw-p-4"
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {components[activeTab]}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WaveLeaderboardRightSidebar;