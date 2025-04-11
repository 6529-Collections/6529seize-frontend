import React, { useEffect, useState } from "react";
import { TabToggle } from "../../common/TabToggle";
import { ApiWave } from "../../../generated/models/ApiWave";
import { MyStreamWaveTab } from "../../../types/waves.types";
import { useContentTab, WaveVotingState } from "../ContentTabContext";
import { useWave } from "../../../hooks/useWave";
import { useWaveTimers } from "../../../hooks/useWaveTimers";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";
import { useDecisionPoints } from "../../../hooks/waves/useDecisionPoints";
import { Time } from "../../../helpers/time";
import { calculateTimeLeft, TimeLeft } from "../../../helpers/waves/time.utils";
import { CompactTimeCountdown } from "../../waves/leaderboard/time/CompactTimeCountdown";

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

  const { isChatWave, isMemesWave, isRankWave } = useWave(wave);
  const {
    voting: { isUpcoming, isCompleted, isInProgress },
    decisions: { firstDecisionDone },
  } = useWaveTimers(wave);

  // For next decision countdown
  const { allDecisions } = useDecisionPoints(wave);
  const nextDecisionTime =
    allDecisions.find((decision) => decision.timestamp > Time.currentMillis())
      ?.timestamp ?? null;

  // Calculate time left for next decision
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Initial calculation
    if (nextDecisionTime) {
      setTimeLeft(calculateTimeLeft(nextDecisionTime));
    }

    // Only set up interval if there's a next decision
    if (nextDecisionTime) {
      const intervalId = setInterval(() => {
        const newTimeLeft = calculateTimeLeft(nextDecisionTime);
        setTimeLeft(newTimeLeft);

        // Clear interval when countdown reaches zero
        if (
          newTimeLeft.days === 0 &&
          newTimeLeft.hours === 0 &&
          newTimeLeft.minutes === 0 &&
          newTimeLeft.seconds === 0
        ) {
          clearInterval(intervalId);
        }
      }, 1000);

      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [nextDecisionTime]);

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
    <div className="tw-@container/tabs tw-flex tw-items-start tw-gap-4 tw-justify-between tw-w-full tw-mb-2 tw-overflow-x-auto tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-scrollbar-thin">
      <TabToggle
        options={options}
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key as MyStreamWaveTab)}
      />

      {/* Next winner announcement for memes and rank waves, only in chat view and only if there's an upcoming decision */}
      {(isMemesWave || isRankWave) &&
        nextDecisionTime &&
        activeTab === MyStreamWaveTab.CHAT && (
          <CompactTimeCountdown
            timeLeft={timeLeft}
          />
        )}
    </div>
  );
};

export default MyStreamWaveDesktopTabs;
