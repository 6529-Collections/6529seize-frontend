"use client";

import React, { useMemo, useEffect, type JSX } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ObjectSerializer";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { TabToggleWithOverflow } from "@/components/common/TabToggleWithOverflow";
import WaveHeader, {
  WaveHeaderPinnedSide,
} from "@/components/waves/header/WaveHeader";
import { WaveWinnersSmall } from "@/components/waves/winners/WaveWinnersSmall";
import BrainRightSidebarContent from "./BrainRightSidebarContent";
import BrainRightSidebarFollowers from "./BrainRightSidebarFollowers";
import { Mode, SidebarTab } from "./BrainRightSidebar";
import { WaveSmallLeaderboard } from "@/components/waves/small-leaderboard/WaveSmallLeaderboard";
import { WaveLeaderboardRightSidebarVoters } from "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarVoters";
import { WaveLeaderboardRightSidebarActivityLogs } from "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLogs";
import { useWaveTimers } from "@/hooks/useWaveTimers";

interface WaveContentProps {
  readonly wave: ApiWave;
  readonly mode: Mode;
  readonly setMode: (mode: Mode) => void;
  readonly activeTab: SidebarTab;
  readonly setActiveTab: (tab: SidebarTab) => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

interface TabOption {
  key: SidebarTab;
  label: string;
}

export const WaveContent: React.FC<WaveContentProps> = ({
  wave,
  mode,
  setMode,
  activeTab,
  setActiveTab,
  onDropClick,
}) => {
  const onFollowersClick = () =>
    setMode(mode === Mode.FOLLOWERS ? Mode.CONTENT : Mode.FOLLOWERS);

  const isRankWave = wave.wave.type === ApiWaveType.Rank;
  const {
    voting: { isCompleted },
    decisions: { firstDecisionDone },
  } = useWaveTimers(wave);

  // Handle tab validity when wave state changes
  useEffect(() => {
    const isLeaderboardAndVotingEnded =
      activeTab === SidebarTab.LEADERBOARD && isCompleted;
    const isWinnersAndFirstDecisionNotPassed =
      activeTab === SidebarTab.WINNERS && !firstDecisionDone;
    // If on Leaderboard tab and voting has ended, switch to About
    if (isLeaderboardAndVotingEnded || isWinnersAndFirstDecisionNotPassed) {
      setActiveTab(SidebarTab.ABOUT);
    }
  }, [isCompleted, firstDecisionDone, activeTab, setActiveTab]);

  // Generate tab options based on wave state
  const options = useMemo(() => {
    const tabs: TabOption[] = [{ key: SidebarTab.ABOUT, label: "About" }];

    // Show Leaderboard tab always except when voting has ended
    if (!isCompleted) {
      tabs.push({ key: SidebarTab.LEADERBOARD, label: "Leaderboard" });
    }

    // Show Winners tab if first decision has passed
    if (firstDecisionDone) {
      tabs.push({ key: SidebarTab.WINNERS, label: "Winners" });
    }

    tabs.push(
      { key: SidebarTab.TOP_VOTERS, label: "Voters" },
      { key: SidebarTab.ACTIVITY_LOG, label: "Activity" }
    );

    return tabs;
  }, [isCompleted, firstDecisionDone]);

  const rankWaveComponents: Record<SidebarTab, JSX.Element> = {
    [SidebarTab.ABOUT]: (
      <div className="tw-h-full tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-700">
        <WaveHeader
          wave={wave}
          onFollowersClick={onFollowersClick}
          useRing={false}
          useRounded={false}
          pinnedSide={WaveHeaderPinnedSide.LEFT}
        />
        {mode === Mode.CONTENT ? (
          <BrainRightSidebarContent wave={wave} onDropClick={onDropClick} />
        ) : (
          <BrainRightSidebarFollowers
            wave={wave}
            closeFollowers={() => setMode(Mode.CONTENT)}
          />
        )}
      </div>
    ),
    [SidebarTab.LEADERBOARD]: (
      <div>
        <WaveSmallLeaderboard wave={wave} onDropClick={onDropClick} />
      </div>
    ),
    [SidebarTab.WINNERS]: (
      <div>
        <WaveWinnersSmall wave={wave} onDropClick={onDropClick} />
      </div>
    ),
    [SidebarTab.TOP_VOTERS]: (
      <div className="tw-p-4">
        <WaveLeaderboardRightSidebarVoters wave={wave} />
      </div>
    ),
    [SidebarTab.ACTIVITY_LOG]: (
      <div className="tw-p-4">
        <WaveLeaderboardRightSidebarActivityLogs
          wave={wave}
          onDropClick={onDropClick}
        />
      </div>
    ),
  };

  if (!isRankWave) {
    return (
      <div className="tw-h-full tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-700">
        <WaveHeader
          wave={wave}
          onFollowersClick={onFollowersClick}
          useRing={false}
          useRounded={false}
          pinnedSide={WaveHeaderPinnedSide.LEFT}
        />
        {mode === Mode.CONTENT ? (
          <BrainRightSidebarContent wave={wave} onDropClick={onDropClick} />
        ) : (
          <BrainRightSidebarFollowers
            wave={wave}
            closeFollowers={() => setMode(Mode.CONTENT)}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="tw-pb-px tw-pl-2.5">
        <TabToggleWithOverflow
          options={options}
          activeKey={activeTab}
          onSelect={(key) => setActiveTab(key as SidebarTab)}
          maxVisibleTabs={3} // Show 3 tabs before overflow
        />
      </div>
      <div>{rankWaveComponents[activeTab]}</div>
    </>
  );
};
