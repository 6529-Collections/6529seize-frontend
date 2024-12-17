import { ApiWave } from "../../../generated/models/ApiWave";
import { ApiWaveType } from "../../../generated/models/ObjectSerializer";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { TabToggle } from "../../common/TabToggle";
import WaveHeader, { WaveHeaderPinnedSide } from "../../waves/detailed/header/WaveHeader";
import { WaveDetailedSmallLeaderboard } from "../../waves/detailed/small-leaderboard/WaveDetailedSmallLeaderboard";
import BrainRightSidebarContent from "./BrainRightSidebarContent";
import BrainRightSidebarFollowers from "./BrainRightSidebarFollowers";
import { Mode, SidebarTab } from "./BrainRightSidebar";

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

  const options = [
    { key: SidebarTab.ABOUT, label: "About" },
    { key: SidebarTab.LEADERBOARD, label: "Leaderboard" },
  ] as const;

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
      <div className="tw-px-4 tw-mt-4">
        <TabToggle
          options={options}
          activeKey={activeTab}
          onSelect={(key) => setActiveTab(key as SidebarTab)}
        />
      </div>
      {activeTab === SidebarTab.ABOUT ? (
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
      ) : (
        <WaveDetailedSmallLeaderboard wave={wave} onDropClick={onDropClick} />
      )}
    </>
  );
};
