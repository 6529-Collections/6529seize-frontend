"use client";

import React, { useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { commonApiFetch } from "../../../services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { WaveContent } from "./WaveContent";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";

interface BrainRightSidebarProps {
  readonly waveId: string | null | undefined;
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
  WINNERS = "WINNERS",
  TOP_VOTERS = "TOP_VOTERS",
  ACTIVITY_LOG = "ACTIVITY_LOG",
}

const BrainRightSidebar: React.FC<BrainRightSidebarProps> = ({
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
    <div
      className="tw-fixed tw-inset-y-0 tw-right-0 tw-z-40 tw-bg-iron-950 tw-flex tw-flex-col
        tw-w-[20.5rem] 
        lg:tw-bg-opacity-95 min-[1300px]:tw-bg-opacity-100
        lg:tw-backdrop-blur min-[1300px]:tw-backdrop-blur-none tw-border-l tw-border-solid tw-border-iron-800 tw-border-y-0 tw-border-r-0"
    >
      <div
        className="tw-text-iron-500 tw-text-sm tw-overflow-y-auto 
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
    </div>
  );
};

export default BrainRightSidebar;
