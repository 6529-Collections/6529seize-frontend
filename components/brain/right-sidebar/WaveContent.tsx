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
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

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

const WAVE_RIGHT_SIDEBAR_LOCALE = DEFAULT_LOCALE;

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
    {
      key: SidebarTab.ABOUT,
      label: t(
        WAVE_RIGHT_SIDEBAR_LOCALE,
        "waves.sidebar.rightPanel.tabs.about"
      ),
    },
    {
      key: SidebarTab.RULES,
      label: t(
        WAVE_RIGHT_SIDEBAR_LOCALE,
        "waves.sidebar.rightPanel.tabs.rules"
      ),
    },
    {
      key: SidebarTab.REP,
      label: t(WAVE_RIGHT_SIDEBAR_LOCALE, "waves.sidebar.rightPanel.tabs.rep"),
    },
    {
      key: SidebarTab.SETTINGS,
      label: t(
        WAVE_RIGHT_SIDEBAR_LOCALE,
        "waves.sidebar.rightPanel.tabs.settings"
      ),
    },
    ...(isCompetitionWave
      ? [
          {
            key: SidebarTab.TOP_VOTERS,
            label: t(
              WAVE_RIGHT_SIDEBAR_LOCALE,
              "waves.sidebar.rightPanel.tabs.voters"
            ),
          },
          {
            key: SidebarTab.ACTIVITY_LOG,
            label: t(
              WAVE_RIGHT_SIDEBAR_LOCALE,
              "waves.sidebar.rightPanel.tabs.activity"
            ),
          },
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
        <WaveRules wave={wave} useRing={false} showTitle={false} />
      </div>
    ),
    [SidebarTab.SETTINGS]: <BrainRightSidebarSettings wave={wave} />,
    ...(isCompetitionWave
      ? {
          [SidebarTab.TOP_VOTERS]: (
            <div className="tw-min-w-0 tw-p-4">
              <WaveLeaderboardRightSidebarVoters wave={wave} />
            </div>
          ),
          [SidebarTab.ACTIVITY_LOG]: (
            <div className="tw-min-w-0 tw-p-4">
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
    <div className="tw-flex tw-h-full tw-min-h-0 tw-min-w-0 tw-flex-col tw-overflow-hidden">
      <div className="tw-no-scrollbar tw-min-w-0 tw-flex-shrink-0 tw-overflow-x-auto tw-overflow-y-hidden tw-overscroll-x-contain tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-px-2 [&_button[role=tab][aria-selected=true]]:tw-border-iron-400 [&_button[role=tab][aria-selected=true]]:tw-text-iron-100 [&_button[role=tab]]:tw-px-2 [&_button[role=tab]]:tw-py-2.5 [&_button[role=tab]]:tw-text-sm [&_button[role=tab]]:tw-font-semibold [&_button[role=tab]]:tw-tracking-normal">
        <TabToggleWithOverflow
          options={options}
          activeKey={activeSidebarTab}
          onSelect={(key) => setActiveTab(key as SidebarTab)}
          maxVisibleTabs={options.length}
        />
      </div>
      <div className="tw-min-h-0 tw-min-w-0 tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden tw-overscroll-x-none tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300">
        {activeSidebarComponent}
      </div>
    </div>
  );
};
