"use client";

import React, { useEffect, useState } from "react";
import { TabToggle } from "../../common/TabToggle";
import { ApiWave } from "../../../generated/models/ApiWave";
import { MyStreamWaveTab } from "../../../types/waves.types";
import { useContentTab, WaveVotingState } from "../ContentTabContext";
import { useWave } from "../../../hooks/useWave";
import { useWaveTimers } from "../../../hooks/useWaveTimers";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";
import { useSidebarState } from "../../../hooks/useSidebarState";

interface MyStreamWaveDesktopTabsProps {
  readonly activeTab: MyStreamWaveTab;
  readonly wave: ApiWave;
  readonly setActiveTab: (tab: MyStreamWaveTab) => void;
}

interface TabOption {
  key: MyStreamWaveTab;
  label: string;
}

const MyStreamWaveDesktopTabs: React.FC<MyStreamWaveDesktopTabsProps> = ({
  activeTab,
  wave,
  setActiveTab,
}) => {
  // Use the available tabs from context instead of recalculating
  const { availableTabs, updateAvailableTabs, setActiveContentTab } =
    useContentTab();

  const {
    isChatWave,
    isMemesWave,
  } = useWave(wave);
  
  // Sidebar state for info panel
  const { toggleRightSidebar } = useSidebarState();
  const {
    voting: { isUpcoming, isCompleted, isInProgress },
    decisions: { firstDecisionDone },
  } = useWaveTimers(wave);


  // Update available tabs when wave changes
  useEffect(() => {
    const votingState = isUpcoming
      ? WaveVotingState.NOT_STARTED
      : isCompleted
      ? WaveVotingState.ENDED
      : WaveVotingState.ONGOING;
    updateAvailableTabs(
      wave
        ? {
            isMemesWave,
            isChatWave,
            votingState,
            hasFirstDecisionPassed: firstDecisionDone,
          }
        : null
    );
  }, [
    wave,
    isUpcoming,
    isCompleted,
    isInProgress,
    firstDecisionDone,
    updateAvailableTabs,
  ]);

  // Always switch to Chat for Chat-type waves
  useEffect(() => {
    if (wave?.wave?.type === ApiWaveType.Chat) {
      setActiveContentTab(MyStreamWaveTab.CHAT);
    }
  }, [wave?.wave?.type, setActiveContentTab]);

  // Map enum values to label names
  const tabLabels: Record<MyStreamWaveTab, string> = {
    [MyStreamWaveTab.CHAT]: "Chat",
    [MyStreamWaveTab.LEADERBOARD]: "Leaderboard",
    [MyStreamWaveTab.WINNERS]: "Winners",
    [MyStreamWaveTab.OUTCOME]: "Outcome",
    [MyStreamWaveTab.MY_VOTES]: "My Votes",
    [MyStreamWaveTab.FAQ]: "FAQ",
  };

  const options: TabOption[] = availableTabs
    .filter(
      (tab) =>
        isMemesWave ||
        ![MyStreamWaveTab.MY_VOTES, MyStreamWaveTab.FAQ].includes(tab)
    )
    .map((tab) => ({
      key: tab,
      label: tabLabels[tab],
    }));

  useEffect(() => {
    if (
      !isMemesWave &&
      [MyStreamWaveTab.MY_VOTES, MyStreamWaveTab.FAQ].includes(activeTab) &&
      options.length > 0
    ) {
      setActiveTab(options[0].key);
    }
  }, [isMemesWave, activeTab, options]);

  // For simple waves, don't render any tabs
  if (isChatWave) {
    return null;
  }

  return (
    <div className="tw-@container/tabs tw-flex tw-items-center tw-gap-4 tw-justify-between tw-w-full tw-overflow-x-auto tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-scrollbar-thin tw-border-y tw-border-solid tw-border-iron-800 tw-border-x-0 tw-px-2 sm:tw-px-4 md:tw-px-6">
      <TabToggle
        options={options}
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key as MyStreamWaveTab)}
      />
      
      {/* Right sidebar toggle button - far right from tabs */}
      <button
        type="button"
        onClick={toggleRightSidebar}
        className="tw-group tw-size-8 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-700 tw-border tw-border-solid tw-border-iron-800 tw-transition-all tw-duration-200 desktop-hover:hover:tw-bg-iron-600 desktop-hover:hover:tw-border-iron-700 tw-shadow-sm tw-flex-shrink-0"
        aria-label="Toggle right sidebar"
      >
        <svg
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true" role="img"
          className="tw-text-iron-200 group-hover:tw-text-white tw-flex-shrink-0"
        >
          <path 
            fillRule="evenodd" 
            clipRule="evenodd" 
            d="M2 5C2 3.34315 3.34315 2 5 2H19C20.6569 2 22 3.34315 22 5V19C22 20.6569 20.6569 22 19 22H5C3.34315 22 2 20.6569 2 19V5ZM4 13V19C4 19.5523 4.44772 20 5 20H15V4H5C4.44772 4 4 4.44772 4 5V11H8.58579L7.29289 9.70711C6.90237 9.31658 6.90237 8.68342 7.29289 8.29289C7.68342 7.90237 8.31658 7.90237 8.70711 8.29289L11.7071 11.2929C12.0976 11.6834 12.0976 12.3166 11.7071 12.7071L8.70711 15.7071C8.31658 16.0976 7.68342 16.0976 7.29289 15.7071C6.90237 15.3166 6.90237 14.6834 7.29289 14.2929L8.58579 13H4ZM17 4V20H19C19.5523 20 20 19.5523 20 19V5C20 4.44772 19.5523 4 19 4H17Z" 
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
};

export default MyStreamWaveDesktopTabs;
