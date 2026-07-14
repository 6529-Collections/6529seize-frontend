"use client";

import React, { type JSX } from "react";
import clsx from "clsx";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import {
  TabToggleWithOverflow,
  type TabToggleWithOverflowVariant,
} from "@/components/common/TabToggleWithOverflow";
import WaveHeader from "@/components/waves/header/WaveHeader";
import BrainRightSidebarContent from "./BrainRightSidebarContent";
import BrainRightSidebarFollowers from "./BrainRightSidebarFollowers";
import BrainRightSidebarSettings from "./BrainRightSidebarSettings";
import { Mode, SidebarTab } from "./BrainRightSidebarTypes";
import WaveRepDetails from "./WaveRepDetails";
import { WaveLeaderboardRightSidebarVoters } from "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarVoters";
import { WaveLeaderboardRightSidebarActivityLogs } from "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLogs";
import WaveRules from "@/components/waves/specs/WaveRules";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";

interface WaveContentProps {
  readonly wave: ApiWave;
  readonly mode: Mode;
  readonly setMode: (mode: Mode) => void;
  readonly activeTab: SidebarTab;
  readonly setActiveTab: (tab: SidebarTab) => void;
  readonly maxVisibleTabs?: number | undefined;
  readonly tabVariant?: TabToggleWithOverflowVariant | undefined;
  readonly aboutTabLabel?: string | undefined;
  readonly showTabs?: boolean | undefined;
}

interface TabOption {
  key: SidebarTab;
  label: string;
}

interface WaveContentTabsProps {
  readonly wave: ApiWave;
  readonly activeTab: SidebarTab;
  readonly setActiveTab: (tab: SidebarTab) => void;
  readonly maxVisibleTabs?: number | undefined;
  readonly variant?: TabToggleWithOverflowVariant | undefined;
  readonly aboutTabLabel?: string | undefined;
}

export const WaveContentTabs: React.FC<WaveContentTabsProps> = ({
  wave,
  activeTab,
  setActiveTab,
  maxVisibleTabs,
  variant = "underline",
  aboutTabLabel,
}) => {
  const isCompetitionWave =
    wave.wave.type === ApiWaveType.Rank ||
    wave.wave.type === ApiWaveType.Approve;
  const options: TabOption[] = [
    {
      key: SidebarTab.ABOUT,
      label:
        aboutTabLabel ??
        waveRightPanelText("waves.sidebar.rightPanel.tabs.about"),
    },
    {
      key: SidebarTab.RULES,
      label: waveRightPanelText("waves.sidebar.rightPanel.tabs.rules"),
    },
    {
      key: SidebarTab.REP,
      label: waveRightPanelText("waves.sidebar.rightPanel.tabs.rep"),
    },
    {
      key: SidebarTab.SETTINGS,
      label: waveRightPanelText("waves.sidebar.rightPanel.tabs.settings"),
    },
    ...(isCompetitionWave
      ? [
          {
            key: SidebarTab.TOP_VOTERS,
            label: waveRightPanelText("waves.sidebar.rightPanel.tabs.voters"),
          },
          {
            key: SidebarTab.ACTIVITY_LOG,
            label: waveRightPanelText("waves.sidebar.rightPanel.tabs.activity"),
          },
        ]
      : []),
  ];

  return (
    <div
      className={clsx(
        "tw-no-scrollbar tw-min-w-0 tw-flex-shrink-0 tw-overflow-x-auto tw-overflow-y-hidden tw-overscroll-x-contain tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid",
        variant === "compactPills"
          ? "tw-border-iron-900 tw-bg-iron-950 tw-px-2 tw-py-2 sm:tw-px-4 md:tw-px-6"
          : "tw-border-white/5 tw-px-2 [&_button[role=tab]]:tw-px-2 [&_button[role=tab]]:tw-py-2.5 [&_button[role=tab]]:!tw-text-sm [&_button[role=tab]]:tw-font-medium [&_button[role=tab]]:tw-tracking-normal"
      )}
    >
      <TabToggleWithOverflow
        options={options}
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key as SidebarTab)}
        maxVisibleTabs={maxVisibleTabs ?? options.length}
        variant={variant}
      />
    </div>
  );
};

export const WaveContent: React.FC<WaveContentProps> = ({
  wave,
  mode,
  setMode,
  activeTab,
  setActiveTab,
  maxVisibleTabs,
  tabVariant = "underline",
  aboutTabLabel,
  showTabs = true,
}) => {
  const onFollowersClick = () =>
    setMode(mode === Mode.FOLLOWERS ? Mode.CONTENT : Mode.FOLLOWERS);

  const isRankWave = wave.wave.type === ApiWaveType.Rank;
  const isApproveWave = wave.wave.type === ApiWaveType.Approve;
  const isCompetitionWave = isRankWave || isApproveWave;
  const visibleTabLimit = maxVisibleTabs ?? (isCompetitionWave ? 4 : undefined);

  const sidebarTabComponents: Partial<Record<SidebarTab, JSX.Element>> = {
    [SidebarTab.ABOUT]: (
      <div className="tw-h-full tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/5">
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
    <div className="tw-flex tw-h-full tw-min-h-0 tw-min-w-0 tw-flex-col tw-overflow-hidden tw-bg-iron-950">
      {showTabs && (
        <WaveContentTabs
          wave={wave}
          activeTab={activeSidebarTab}
          setActiveTab={setActiveTab}
          maxVisibleTabs={visibleTabLimit}
          variant={tabVariant}
          aboutTabLabel={aboutTabLabel}
        />
      )}
      <div className="tw-min-h-0 tw-min-w-0 tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden tw-overscroll-x-none tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300">
        {activeSidebarComponent}
      </div>
    </div>
  );
};
