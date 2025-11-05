"use client";

import React, { useEffect, useState } from "react";
import { TabToggle } from "@/components/common/TabToggle";
import { ApiWave } from "@/generated/models/ApiWave";
import { MyStreamWaveTab } from "@/types/waves.types";
import { useContentTab, WaveVotingState } from "../ContentTabContext";
import { useWave } from "@/hooks/useWave";
import { useWaveTimers } from "@/hooks/useWaveTimers";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useDecisionPoints } from "@/hooks/waves/useDecisionPoints";
import { Time } from "@/helpers/time";

interface MyStreamWaveDesktopTabsProps {
  readonly activeTab: MyStreamWaveTab;
  readonly wave: ApiWave;
  readonly setActiveTab: (tab: MyStreamWaveTab) => void;
}

interface TabOption {
  key: MyStreamWaveTab;
  label: string;
  panelId: string;
}

const getContentTabPanelId = (tab: MyStreamWaveTab): string =>
  `my-stream-wave-tabpanel-${tab.toLowerCase()}`;

const AUTO_EXPAND_LIMIT = 5;

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
    pauses: { filterDecisionsDuringPauses },
  } = useWave(wave);
  const {
    voting: { isUpcoming, isCompleted, isInProgress },
    decisions: { firstDecisionDone },
  } = useWaveTimers(wave);

  // For next decision countdown
  const { allDecisions, hasMoreFuture, loadMoreFuture } = useDecisionPoints(
    wave,
    {
      initialPastWindow: 3,
      initialFutureWindow: 10,
    }
  );

  // Filter out decisions that occur during pause periods using the helper from useWave
  const filteredDecisions = React.useMemo(() => {
    // Convert DecisionPoint[] to ApiWaveDecision[] format for the filter function
    const decisionsAsApiFormat = allDecisions.map(
      (decision) =>
        ({
          decision_time: decision.timestamp,
        } as any)
    );

    // Apply the filter
    const filtered = filterDecisionsDuringPauses(decisionsAsApiFormat);

    // Convert back to DecisionPoint[] format
    return allDecisions.filter((decision) =>
      filtered.some((f) => f.decision_time === decision.timestamp)
    );
  }, [allDecisions, filterDecisionsDuringPauses]);

  // Get the next valid decision time (excluding paused decisions)
  const nextDecisionTime =
    filteredDecisions.find(
      (decision) => decision.timestamp > Time.currentMillis()
    )?.timestamp ?? null;

  const [autoExpandFutureAttempts, setAutoExpandFutureAttempts] = useState(0);

  useEffect(() => {
    const hasUpcoming = !!nextDecisionTime;

    if (hasUpcoming) {
      if (autoExpandFutureAttempts !== 0) {
        setAutoExpandFutureAttempts(0);
      }
      return;
    }

    if (!hasMoreFuture) {
      if (autoExpandFutureAttempts !== 0) {
        setAutoExpandFutureAttempts(0);
      }
      return;
    }

    if (autoExpandFutureAttempts >= AUTO_EXPAND_LIMIT) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      setAutoExpandFutureAttempts((prev) => prev + 1);
      loadMoreFuture();
    }, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    nextDecisionTime,
    hasMoreFuture,
    loadMoreFuture,
    autoExpandFutureAttempts,
  ]);

  // Calculate time left for next decision
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
    isMemesWave,
    isChatWave,
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

  const options: TabOption[] = React.useMemo(
    () =>
      availableTabs
        .filter(
          (tab) =>
            isMemesWave ||
            ![MyStreamWaveTab.MY_VOTES, MyStreamWaveTab.FAQ].includes(tab)
        )
        .map((tab) => ({
          key: tab,
          label: tabLabels[tab],
          panelId: getContentTabPanelId(tab),
        })),
    [availableTabs, isMemesWave]
  );

  useEffect(() => {
    if (
      !isMemesWave &&
      [MyStreamWaveTab.MY_VOTES, MyStreamWaveTab.FAQ].includes(activeTab) &&
      options.length > 0
    ) {
      setActiveTab(options[0].key);
    }
  }, [isMemesWave, activeTab, options, setActiveTab]);

  // For simple waves, don't render any tabs
  if (isChatWave) {
    return null;
  }

  return (
    <div className="tw-@container/tabs tw-px-2 sm:tw-px-4 tw-flex tw-items-start tw-gap-4 tw-justify-between tw-w-full tw-overflow-x-auto tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-scrollbar-thin">
      <TabToggle
        options={options}
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key as MyStreamWaveTab)}
      />
    </div>
  );
};

export default MyStreamWaveDesktopTabs;
