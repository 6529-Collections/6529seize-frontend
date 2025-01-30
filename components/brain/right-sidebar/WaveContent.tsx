import { ApiWave } from "../../../generated/models/ApiWave";
import { ApiWaveType } from "../../../generated/models/ObjectSerializer";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { TabToggle } from "../../common/TabToggle";
import WaveHeader, {
  WaveHeaderPinnedSide,
} from "../../waves/header/WaveHeader";
import { WaveWinnersSmall } from "../../waves/winners/WaveWinnersSmall";
import BrainRightSidebarContent from "./BrainRightSidebarContent";
import BrainRightSidebarFollowers from "./BrainRightSidebarFollowers";
import { Mode, SidebarTab } from "./BrainRightSidebar";
import { useWaveState, WaveVotingState } from "../../../hooks/useWaveState";
import { motion } from "framer-motion";
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
  const { votingState } = useWaveState(wave);
  const hasVotingEnded = votingState === WaveVotingState.ENDED;

  const options = [
    { key: SidebarTab.ABOUT, label: "About" },
    {
      key: SidebarTab.LEADERBOARD,
      label: hasVotingEnded ? "Winners" : "Leaderboard",
    },
    { key: SidebarTab.TOP_VOTERS, label: "Voters" },
    { key: SidebarTab.ACTIVITY_LOG, label: "Activity" },
  ] as const;

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
        {hasVotingEnded ? (
          <WaveWinnersSmall wave={wave} onDropClick={onDropClick} />
        ) : (
          <WaveSmallLeaderboard wave={wave} onDropClick={onDropClick} />
        )}
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
      <div className="tw-px-2 tw-mt-4">
        <TabToggle
          options={options}
          activeKey={activeTab}
          onSelect={(key) => setActiveTab(key as SidebarTab)}
        />
      </div>
      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {rankWaveComponents[activeTab]}
      </motion.div>
    </>
  );
};
