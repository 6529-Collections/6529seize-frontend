import React, { useEffect } from "react";
import { useContentTab } from "../ContentTabContext";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import MyStreamWaveChat from "./MyStreamWaveChat";
import MyStreamWaveDesktopTabs from "./MyStreamWaveDesktopTabs";
import { useWaveData } from "../../../hooks/useWaveData";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";
import MyStreamWaveLeaderboard from "./MyStreamWaveLeaderboard";
import MyStreamWaveOutcome from "./MyStreamWaveOutcome";
import { createBreakpoint } from "react-use";
import { useRouter } from "next/router";
import { WaveWinners } from "../../waves/winners/WaveWinners";
import { MyStreamWaveTab } from "../../../types/waves.types";
import { useWaveState } from "../../../hooks/useWaveState";

interface MyStreamWaveProps {
  readonly waveId: string;
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

const MyStreamWave: React.FC<MyStreamWaveProps> = ({ waveId }) => {
  const breakpoint = useBreakpoint();
  const router = useRouter();
  const { data: wave } = useWaveData(waveId);
  
  // Get wave state information
  const { votingState, hasFirstDecisionPassed } = useWaveState(wave || undefined);

  const onDropClick = (drop: ExtendedDrop) => {
    const currentQuery = { ...router.query };
    currentQuery.drop = drop.id;
    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  // Get the active tab and utilities from global context
  const { activeContentTab, setActiveContentTab, updateAvailableTabs } = useContentTab();

  // Update available tabs when wave changes
  useEffect(() => {
    updateAvailableTabs(wave, votingState, hasFirstDecisionPassed);
  }, [wave, votingState, hasFirstDecisionPassed, updateAvailableTabs]);

  // Always switch to Chat for Chat-type waves
  useEffect(() => {
    if (wave?.wave.type === ApiWaveType.Chat) {
      setActiveContentTab(MyStreamWaveTab.CHAT);
    }
  }, [wave?.wave.type, setActiveContentTab]);

  if (!wave) {
    return null;
  }

  const components: Record<MyStreamWaveTab, JSX.Element> = {
    [MyStreamWaveTab.CHAT]: <MyStreamWaveChat wave={wave} />,
    [MyStreamWaveTab.LEADERBOARD]: (
      <MyStreamWaveLeaderboard wave={wave} onDropClick={onDropClick} />
    ),
    [MyStreamWaveTab.WINNERS]: (
      <WaveWinners wave={wave} onDropClick={onDropClick} />
    ),
    [MyStreamWaveTab.OUTCOME]: <MyStreamWaveOutcome wave={wave} />,
  };

  return (
    <div className="tw-relative">
      {breakpoint !== "S" && wave.wave.type !== ApiWaveType.Chat && (
        <div
          className={
            activeContentTab === MyStreamWaveTab.CHAT
              ? "tw-absolute tw-top-0 tw-left-0 tw-z-50"
              : ""
          }
        >
          <MyStreamWaveDesktopTabs
            activeTab={activeContentTab}
            wave={wave}
            setActiveTab={setActiveContentTab}
          />
        </div>
      )}
      {components[activeContentTab]}
    </div>
  );
};

export default MyStreamWave;
