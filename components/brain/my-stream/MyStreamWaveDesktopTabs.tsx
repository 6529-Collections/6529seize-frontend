"use client";

import React, { useEffect, useState } from "react";
import { TabToggle } from "../../common/TabToggle";
import { ApiWave } from "../../../generated/models/ApiWave";
import { MyStreamWaveTab } from "../../../types/waves.types";
import { useContentTab, WaveVotingState } from "../ContentTabContext";
import { useWave } from "../../../hooks/useWave";
import { useWaveTimers } from "../../../hooks/useWaveTimers";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";

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
    <div className="tw-@container/tabs tw-flex tw-items-center tw-gap-4 tw-w-full tw-overflow-x-auto tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-scrollbar-thin tw-border-y tw-border-solid tw-border-iron-800 tw-border-x-0 tw-px-2 sm:tw-px-4 md:tw-px-6">
      <TabToggle
        options={options}
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key as MyStreamWaveTab)}
      />
    </div>
  );
};

export default MyStreamWaveDesktopTabs;
