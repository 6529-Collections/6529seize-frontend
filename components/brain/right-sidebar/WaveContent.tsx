"use client";

import React, { type JSX } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { TabToggleWithOverflow } from "@/components/common/TabToggleWithOverflow";
import WaveHeader from "@/components/waves/header/WaveHeader";
import BrainRightSidebarContent from "./BrainRightSidebarContent";
import BrainRightSidebarFollowers from "./BrainRightSidebarFollowers";
import BrainRightSidebarSettings from "./BrainRightSidebarSettings";
import { Mode, SidebarTab } from "./BrainRightSidebarTypes";
import WaveRepDetails from "./WaveRepDetails";
import { WaveLeaderboardRightSidebarVoters } from "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarVoters";
import { WaveLeaderboardRightSidebarActivityLogs } from "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLogs";
import WaveRules from "@/components/waves/specs/WaveRules";

interface WaveContentProps {
  readonly wave: ApiWave;
  readonly mode: Mode;
  readonly setMode: (mode: Mode) => void;
  readonly activeTab: SidebarTab;
  readonly setActiveTab: (tab: SidebarTab) => void;
}

interface TabOption {
  key: SidebarTab;
  label: string;
}

export const WaveContent: React.FC<WaveContentProps> = ({
  wave,
  mode,
  setMode,
  activeTab,
  setActiveTab,
}) => {
  const onFollowersClick = () =>
    setMode(mode === Mode.FOLLOWERS ? Mode.CONTENT : Mode.FOLLOWERS);

  const isRankWave = wave.wave.type === ApiWaveType.Rank;
  const isApproveWave = wave.wave.type === ApiWaveType.Approve;
  const isCompetitionWave = isRankWave || isApproveWave;
  const options: TabOption[] = [
    { key: SidebarTab.ABOUT, label: "About" },
    { key: SidebarTab.RULES, label: "Rules" },
    { key: SidebarTab.REP, label: "REP" },
    { key: SidebarTab.SETTINGS, label: "Settings" },
    ...(isCompetitionWave
      ? [
          { key: SidebarTab.TOP_VOTERS, label: "Voters" },
          { key: SidebarTab.ACTIVITY_LOG, label: "Activity" },
        ]
      : []),
  ];

  const sidebarTabComponents: Partial<Record<SidebarTab, JSX.Element>> = {
    [SidebarTab.ABOUT]: (
      <div className="tw-h-full tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-700">
        <WaveHeader
          wave={wave}
          onFollowersClick={onFollowersClick}
          useRing={false}
          useRounded={false}
        />
        {mode === Mode.CONTENT ? (
          <BrainRightSidebarContent wave={wave} />
        ) : (
          <BrainRightSidebarFollowers
            wave={wave}
            closeFollowers={() => setMode(Mode.CONTENT)}
          />
        )}
      </div>
    ),
    [SidebarTab.REP]: <WaveRepDetails wave={wave} />,
    [SidebarTab.RULES]: (
      <div className="tw-px-0">
        <WaveRules wave={wave} useRing={false} />
      </div>
    ),
    [SidebarTab.SETTINGS]: <BrainRightSidebarSettings wave={wave} />,
    ...(isCompetitionWave
      ? {
          [SidebarTab.TOP_VOTERS]: (
            <div className="tw-p-4">
              <WaveLeaderboardRightSidebarVoters wave={wave} />
            </div>
          ),
          [SidebarTab.ACTIVITY_LOG]: (
            <div className="tw-p-4">
              <WaveLeaderboardRightSidebarActivityLogs wave={wave} />
            </div>
          ),
        }
      : {}),
  };
  const activeSidebarTab = sidebarTabComponents[activeTab]
    ? activeTab
    : SidebarTab.ABOUT;
  const activeSidebarComponent = sidebarTabComponents[activeSidebarTab];

  return (
    <>
      <div className="tw-pb-px tw-pl-2.5">
        <TabToggleWithOverflow
          options={options}
          activeKey={activeSidebarTab}
          onSelect={(key) => setActiveTab(key as SidebarTab)}
          maxVisibleTabs={options.length}
        />
      </div>
      <div>{activeSidebarComponent}</div>
    </>
  );
};
