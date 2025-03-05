import React, { useMemo, useEffect } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ApiWaveType } from "../../../generated/models/ObjectSerializer";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { TabToggleWithOverflow } from "../../common/TabToggleWithOverflow";
import WaveHeader, {
  WaveHeaderPinnedSide,
} from "../../waves/header/WaveHeader";
import { WaveWinnersSmall } from "../../waves/winners/WaveWinnersSmall";
import BrainRightSidebarContent from "./BrainRightSidebarContent";
import BrainRightSidebarFollowers from "./BrainRightSidebarFollowers";
import { Mode, SidebarTab } from "./BrainRightSidebar";
import { useWaveState, WaveVotingState } from "../../../hooks/useWaveState";
import { WaveSmallLeaderboard } from "../../waves/small-leaderboard/WaveSmallLeaderboard";
import { WaveLeaderboardRightSidebarVoters } from "../../waves/leaderboard/sidebar/WaveLeaderboardRightSidebarVoters";
import { WaveLeaderboardRightSidebarActivityLogs } from "../../waves/leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLogs";

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
  const { hasFirstDecisionPassed, votingState } = useWaveState(wave);
  
  // Handle tab validity when wave state changes
  useEffect(() => {
    // If on Leaderboard tab and voting has ended, switch to About
    if (activeTab === SidebarTab.LEADERBOARD && votingState === WaveVotingState.ENDED) {
      setActiveTab(SidebarTab.ABOUT);
    }
    // If on Winners tab and first decision hasn't passed, switch to About
    else if (activeTab === SidebarTab.WINNERS && !hasFirstDecisionPassed) {
      setActiveTab(SidebarTab.ABOUT);
    }
  }, [votingState, hasFirstDecisionPassed, activeTab, setActiveTab]);

  // Generate tab options based on wave state
  const options = useMemo(() => {
    const tabs: TabOption[] = [
      { key: SidebarTab.ABOUT, label: "About" },
    ];
    
    // Show Leaderboard tab always except when voting has ended
    if (votingState !== WaveVotingState.ENDED) {
      tabs.push({ key: SidebarTab.LEADERBOARD, label: "Leaderboard" });
    }
    
    // Show Winners tab if first decision has passed
    if (hasFirstDecisionPassed) {
      tabs.push({ key: SidebarTab.WINNERS, label: "Winners" });
    }
    
    tabs.push(
      { key: SidebarTab.TOP_VOTERS, label: "Voters" },
      { key: SidebarTab.ACTIVITY_LOG, label: "Activity" }
    );
    
    return tabs;
  }, [hasFirstDecisionPassed, votingState]);

  const rankWaveComponents: Record<SidebarTab, JSX.Element> = {
    [SidebarTab.ABOUT]: (
      <div className="tw-mt-4 tw-h-full tw-divide-y tw-divide-solid tw-divide-iron-800 tw-divide-x-0">
        <WaveHeader
          wave={wave}
          onFollowersClick={onFollowersClick}
          useRing={false}
          useRounded={false}
          pinnedSide={WaveHeaderPinnedSide.LEFT}
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
      <div className="tw-h-full tw-divide-y tw-divide-solid tw-divide-iron-800 tw-divide-x-0">
        <WaveHeader
          wave={wave}
          onFollowersClick={onFollowersClick}
          useRing={false}
          useRounded={false}
          pinnedSide={WaveHeaderPinnedSide.LEFT}
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
    );
  }

  return (
    <>
      <div className="tw-px-3 tw-mt-4 tw-mb-2">
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
