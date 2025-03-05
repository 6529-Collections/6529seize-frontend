import React, { useEffect, useState } from "react";
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
import { useWaveState, WaveVotingState } from "../../../hooks/useWaveState";

export enum MyStreamWaveTab {
  CHAT = "CHAT",
  LEADERBOARD = "LEADERBOARD",
  WINNERS = "WINNERS",
  OUTCOME = "OUTCOME",
}

interface MyStreamWaveProps {
  readonly waveId: string;
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

const MyStreamWave: React.FC<MyStreamWaveProps> = ({ waveId }) => {
  const breakpoint = useBreakpoint();
  const router = useRouter();
  const { data: wave } = useWaveData(waveId);

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

  const [activeTab, setActiveTab] = useState<MyStreamWaveTab>(
    MyStreamWaveTab.CHAT
  );

  // Update active tab when wave type, voting state, or decision state changes
  useEffect(() => {
    if (!wave) return;
    
    // Always switch to Chat for Chat-type waves
    if (wave.wave.type === ApiWaveType.Chat) {
      setActiveTab(MyStreamWaveTab.CHAT);
      return;
    }
    
    // Handle tab validity based on wave state
    if (activeTab === MyStreamWaveTab.LEADERBOARD && votingState === WaveVotingState.ENDED) {
      // If on Leaderboard tab and voting has ended, switch to Chat
      setActiveTab(MyStreamWaveTab.CHAT);
    } else if (activeTab === MyStreamWaveTab.WINNERS && !hasFirstDecisionPassed) {
      // If on Winners tab and first decision hasn't passed, switch to Chat
      setActiveTab(MyStreamWaveTab.CHAT);
    }
  }, [breakpoint, wave?.wave.type, votingState, hasFirstDecisionPassed, activeTab]);

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
            activeTab === MyStreamWaveTab.CHAT
              ? "tw-absolute tw-top-0 tw-left-0 tw-z-50"
              : ""
          }
        >
          <MyStreamWaveDesktopTabs
            activeTab={activeTab}
            wave={wave}
            setActiveTab={setActiveTab}
          />
        </div>
      )}
      {components[activeTab]}
    </div>
  );
};

export default MyStreamWave;
