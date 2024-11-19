import React from "react";
import { motion } from "framer-motion";
import { ApiWave } from "../../../generated/models/ObjectSerializer";
import { WaveDetailedOutcomes } from "./outcome/WaveDetailedOutcomes";
import { WaveDetailedSmallLeaderboard } from "./small-leaderboard/WaveDetailedSmallLeaderboard";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { useState } from "react";
import { WaveDetailedRightSidebarTabs } from "./WaveDetailedRightSidebarTabs";
import WaveDetailedRightSidebarToggle from "./WaveDetailedRightSidebarToggle";

interface WaveDetailedRightSidebarProps {
  readonly isOpen: boolean;
  readonly wave: ApiWave;
  readonly onToggle: () => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export enum WaveDetailedRightSidebarTab {
  Leaderboard = "Leaderboard",
  Outcomes = "Outcomes",
}

const WaveDetailedRightSidebar: React.FC<WaveDetailedRightSidebarProps> = ({
  isOpen,
  wave,
  onToggle,
  onDropClick,
}) => {
  const [activeTab, setActiveTab] = useState<WaveDetailedRightSidebarTab>(
    WaveDetailedRightSidebarTab.Leaderboard
  );

  const components: Record<WaveDetailedRightSidebarTab, React.ReactNode> = {
    [WaveDetailedRightSidebarTab.Leaderboard]: (
      <WaveDetailedSmallLeaderboard wave={wave} onDropClick={onDropClick} />
    ),
    [WaveDetailedRightSidebarTab.Outcomes]: (
      <WaveDetailedOutcomes wave={wave} />
    ),
  };

  return (
    <motion.div
      className="tw-fixed tw-right-0 tw-top-0 tw-h-screen tw-z-40 tw-bg-iron-950 tw-flex tw-flex-col tw-w-full lg:tw-w-[20.5rem] tw-border-solid tw-border-l-2 tw-border-iron-800 tw-border-y-0 tw-border-b-0 tw-border-r-0"
      initial={false}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="tw-hidden lg:tw-block">
        <WaveDetailedRightSidebarToggle isOpen={isOpen} onToggle={onToggle} />
      </div>
      <div className="tw-pt-[5.6rem] xl:tw-pt-[6.25rem] tw-text-iron-500 tw-text-sm tw-overflow-y-auto horizontal-menu-hide-scrollbar tw-h-full">
        <WaveDetailedRightSidebarTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="tw-h-full"
        >
          {components[activeTab]}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WaveDetailedRightSidebar;
