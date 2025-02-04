import React, { useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { commonApiFetch } from "../../../services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { motion } from "framer-motion";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { WaveContent } from "./WaveContent";

interface BrainRightSidebarProps {
  readonly isCollapsed: boolean;
  readonly setIsCollapsed: (isCollapsed: boolean) => void;
  readonly waveId: string;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly activeTab: SidebarTab;
  readonly setActiveTab: (tab: SidebarTab) => void;
}

export enum Mode {
  CONTENT = "CONTENT",
  FOLLOWERS = "FOLLOWERS",
}

export enum SidebarTab {
  ABOUT = "ABOUT",
  LEADERBOARD = "LEADERBOARD",
  TOP_VOTERS = "TOP_VOTERS",
  ACTIVITY_LOG = "ACTIVITY_LOG",
}

const BrainRightSidebar: React.FC<BrainRightSidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  waveId,
  onDropClick,
  activeTab,
  setActiveTab,
}) => {
  const { data: wave } = useQuery<ApiWave>({
    queryKey: [QueryKey.WAVE, { wave_id: waveId }],
    queryFn: async () =>
      await commonApiFetch<ApiWave>({
        endpoint: `waves/${waveId}`,
      }),
    enabled: !!waveId,
    staleTime: 60000,
    placeholderData: keepPreviousData,
  });

  const [mode, setMode] = useState<Mode>(Mode.CONTENT);

  return (
    <motion.div
      className="tw-fixed tw-right-0 tw-top-0 tw-h-screen tw-z-40 tw-bg-iron-950 tw-flex tw-flex-col
        tw-w-full lg:tw-w-[20.5rem] tw-border-l-2 tw-border-iron-800 tw-border-solid tw-border-y-0 
        tw-border-r-0 tw-shadow-2xl"
      initial={false}
      animate={{ x: isCollapsed ? "100%" : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <button
        type="button"
        aria-label="Toggle sidebar"
        className="tw-absolute -tw-left-[2.625rem] tw-z-50 tw-top-28 tw-bg-iron-950 tw-border tw-border-solid tw-border-r-0
          tw-border-iron-600 tw-size-10 tw-text-iron-400 hover:tw-text-iron-50 tw-rounded-l-lg
          focus:tw-outline-none tw-flex tw-items-center tw-justify-center"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          aria-hidden="true"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className={`tw-size-5 tw-transition-transform tw-duration-300 
            tw-ease-in-out ${isCollapsed ? "tw-rotate-180" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
          />
        </svg>
      </button>
      <div
        className="tw-mt-[5.25rem] min-[1200px]:tw-mt-[6rem] tw-text-iron-500 tw-text-sm tw-overflow-y-auto 
        tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 
        hover:tw-scrollbar-thumb-iron-300 tw-h-full"
      >
        {wave && (
          <WaveContent
            wave={wave}
            mode={mode}
            setMode={setMode}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onDropClick={onDropClick}
          />
        )}
      </div>
    </motion.div>
  );
};

export default BrainRightSidebar;
