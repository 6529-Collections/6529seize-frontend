import React, { useEffect, useRef } from "react";
import { useContentTab, WaveVotingState } from "../ContentTabContext";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import MyStreamWaveChat from "./MyStreamWaveChat";
import { useWaveData } from "../../../hooks/useWaveData";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";
import MyStreamWaveLeaderboard from "./MyStreamWaveLeaderboard";
import MyStreamWaveOutcome from "./MyStreamWaveOutcome";
import { createBreakpoint } from "react-use";
import { useRouter } from "next/router";
import { WaveWinners } from "../../waves/winners/WaveWinners";
import { MyStreamWaveTab } from "../../../types/waves.types";
import { useWave } from "../../../hooks/useWave";
import { useWaveTimers } from "../../../hooks/useWaveTimers";
import { MyStreamWaveTabs } from "./tabs/MyStreamWaveTabs";

interface MyStreamWaveProps {
  readonly waveId: string;
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

const MyStreamWave: React.FC<MyStreamWaveProps> = ({ waveId }) => {
  const breakpoint = useBreakpoint();
  const router = useRouter();
  const { data: wave } = useWaveData(waveId);

  const { isChatWave, isMemesWave } = useWave(wave);
  const {
    voting: { isUpcoming, isCompleted, isInProgress },
    decisions: { firstDecisionDone },
  } = useWaveTimers(wave);

  // Track mount status to prevent post-unmount updates
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Create a stable key for proper remounting
  const stableWaveKey = `wave-${waveId}`;

  // Get the active tab and utilities from global context
  const { activeContentTab, setActiveContentTab, updateAvailableTabs } =
    useContentTab();

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

  // For handling clicks on drops
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

  // Early return if no wave data - all hooks must be called before this
  if (!wave) {
    return null;
  }

  // Create component instances with wave-specific props and stable measurements
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
    <>
      <div
        className="tailwind-scope tw-relative tw-flex tw-flex-col tw-h-full"
        key={stableWaveKey}
      >
        {/* Don't render tab container for simple waves */}
        {breakpoint !== "S" && !isChatWave && <MyStreamWaveTabs wave={wave} />}

        <div className="tw-flex-grow tw-overflow-hidden">
          {components[activeContentTab]}
        </div>
      </div>
    </>
  );
};

export default MyStreamWave;
