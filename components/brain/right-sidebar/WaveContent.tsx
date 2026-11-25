"use client";

import { createPortal } from "react-dom";
import { useWaveInformationPanel } from "@/components/brain/mobile/WaveInformationPanelContext";
import WaveFollowersList from "@/components/waves/followers/WaveFollowersList";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import React, { type JSX } from "react";
import clsx from "clsx";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  TabToggleWithOverflow,
  type TabToggleWithOverflowVariant,
} from "@/components/common/TabToggleWithOverflow";
import WaveHeader from "@/components/waves/header/WaveHeader";
import BrainRightSidebarContent from "./BrainRightSidebarContent";
import BrainRightSidebarFollowers from "./BrainRightSidebarFollowers";
import BrainRightSidebarConfiguration from "./BrainRightSidebarConfiguration";
import { Mode, SidebarTab } from "./BrainRightSidebarTypes";
import WaveRepDetails from "./WaveRepDetails";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import { WavesMoveScope } from "@/components/waves-move/WavesMoveScope";

interface WaveContentProps {
  readonly scrollRef?: React.Ref<HTMLDivElement> | undefined;
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
  readonly activeTab: SidebarTab;
  readonly setActiveTab: (tab: SidebarTab) => void;
  readonly maxVisibleTabs?: number | undefined;
  readonly variant?: TabToggleWithOverflowVariant | undefined;
  readonly aboutTabLabel?: string | undefined;
}

export const WaveContentTabs: React.FC<WaveContentTabsProps> = ({
  activeTab,
  setActiveTab,
  maxVisibleTabs,
  variant = "compactPills",
  aboutTabLabel,
}) => {
  const options: TabOption[] = [
    {
      key: SidebarTab.ABOUT,
      label:
        aboutTabLabel ??
        waveRightPanelText("waves.sidebar.rightPanel.tabs.about"),
    },
    {
      key: SidebarTab.REP,
      label: waveRightPanelText("waves.sidebar.rightPanel.tabs.rep"),
    },
    {
      key: SidebarTab.CONFIGURATION,
      label: waveRightPanelText("waves.sidebar.rightPanel.tabs.configuration"),
    },
  ];

  return (
    <div
      className={clsx(
        "tw-no-scrollbar tw-min-w-0 tw-flex-shrink-0 tw-overflow-x-auto tw-overflow-y-hidden tw-overscroll-x-contain tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid [&_[role=tab][aria-selected=true]]:!tw-font-medium",
        variant === "compactPills"
          ? "tw-border-white/5 tw-bg-iron-950 tw-px-4 tw-py-3.5 md:tw-px-6"
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
  scrollRef,
  wave,
  mode,
  setMode,
  activeTab,
  setActiveTab,
  maxVisibleTabs,
  tabVariant = "compactPills",
  aboutTabLabel,
  showTabs = true,
}) => {
  const members = useWaveInformationPanel(
    t(DEFAULT_LOCALE, "waves.information.members"),
    "wave-members"
  );
  const onFollowersClick = () => {
    if (members.isPhone) members.open();
    else setMode(mode === Mode.FOLLOWERS ? Mode.CONTENT : Mode.FOLLOWERS);
  };

  const visibleTabLimit = maxVisibleTabs;

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
    [SidebarTab.CONFIGURATION]: <BrainRightSidebarConfiguration wave={wave} />,
  };
  const activeSidebarTab = sidebarTabComponents[activeTab]
    ? activeTab
    : SidebarTab.ABOUT;
  const activeSidebarComponent = sidebarTabComponents[activeSidebarTab];

  return (
    <div className="tw-flex tw-h-full tw-min-h-0 tw-min-w-0 tw-flex-col tw-overflow-hidden tw-bg-iron-950">
      {members.isPhone &&
        members.isOpen &&
        members.container &&
        createPortal(<WaveFollowersList wave={wave} />, members.container)}
      {showTabs && (
        <WaveContentTabs
          activeTab={activeSidebarTab}
          setActiveTab={setActiveTab}
          maxVisibleTabs={visibleTabLimit}
          variant={tabVariant}
          aboutTabLabel={aboutTabLabel}
        />
      )}
      <div
        ref={scrollRef}
        className="tw-min-h-0 tw-min-w-0 tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden tw-overscroll-x-none tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300"
      >
        <WavesMoveScope wave={wave} waveId={wave.id}>
          {activeSidebarComponent}
        </WavesMoveScope>
      </div>
    </div>
  );
};
