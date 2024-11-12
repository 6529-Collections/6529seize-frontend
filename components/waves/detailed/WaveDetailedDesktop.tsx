import { ApiWave } from "../../../generated/models/ApiWave";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import WaveDetailedFollowers from "./followers/WaveDetailedFollowers";
import { WaveDetailedView } from "./WaveDetailed";
import WaveDetailedAbout from "./WaveDetailedAbout";
import { WaveChat } from "./chat/WaveChat";
import { WaveLeaderboard } from "./leaderboard/WaveLeaderboard";
import { WaveDetailedDesktopTabs } from "./WaveDetailedDesktopTabs";
import { WaveDrop } from "./drop/WaveDrop";

interface WaveDetailedDesktopProps {
  readonly wave: ApiWave;
  readonly view: WaveDetailedView;
  readonly setView: (view: WaveDetailedView) => void;
  readonly onWaveChange: (wave: ApiWave) => void;
  readonly setIsLoading: (isLoading: boolean) => void;
}

const WaveDetailedDesktop: React.FC<WaveDetailedDesktopProps> = ({
  wave,
  view,
  setView,
  onWaveChange,
  setIsLoading,
}) => {
  const { connectedProfile, activeProfileProxy, showWaves } =
    useContext(AuthContext);

  const getIsAuthorAndNotProxy = () =>
    connectedProfile?.profile?.handle === wave.author.handle &&
    !activeProfileProxy;

  const [isAuthorAndNotProxy, setIsAuthorAndNotProxy] = useState(
    getIsAuthorAndNotProxy()
  );

  useEffect(
    () => setIsAuthorAndNotProxy(getIsAuthorAndNotProxy()),
    [connectedProfile, wave]
  );

  const getShowRequiredMetadata = () =>
    isAuthorAndNotProxy || !!wave.participation.required_metadata.length;

  const [showRequiredMetadata, setShowRequiredMetadata] = useState(
    getShowRequiredMetadata()
  );

  const getShowRequiredTypes = () =>
    isAuthorAndNotProxy || !!wave.participation.required_media.length;

  const [showRequiredTypes, setShowRequiredTypes] = useState(
    getShowRequiredTypes()
  );

  useEffect(() => {
    setShowRequiredMetadata(getShowRequiredMetadata());
    setShowRequiredTypes(getShowRequiredTypes());
  }, [wave, isAuthorAndNotProxy]);

  const components: Record<WaveDetailedView, JSX.Element> = {
    [WaveDetailedView.CHAT]: (
      <WaveChat wave={wave} activeTab={view} setActiveTab={setView} />
    ),
    [WaveDetailedView.LEADERBOARD]: (
      <WaveLeaderboard wave={wave}>
        <WaveDetailedDesktopTabs activeTab={view} setActiveTab={setView} />
      </WaveLeaderboard>
    ),
    [WaveDetailedView.FOLLOWERS]: (
      <WaveDetailedFollowers
        wave={wave}
        onBackClick={() => setView(WaveDetailedView.CHAT)}
      />
    ),
  };

  if (!showWaves) {
    return null;
  }

  return (
    <div className="tailwind-scope tw-bg-black">
      <div className="tw-mt-3 tw-px-4">
        <div className="tw-flex tw-items-start tw-justify-center tw-gap-x-4">
          <div className="tw-fixed tw-inset-y-0 tw-left-0 tw-pl-4 tw-overflow-y-auto no-scrollbar tw-mt-28 lg:tw-w-[21.5rem] tw-w-full">
            <div className="tw-flex tw-flex-1 tw-flex-col">
              <WaveDetailedAbout
                wave={wave}
                setView={setView}
                showRequiredMetadata={showRequiredMetadata}
                showRequiredTypes={showRequiredTypes}
                onWaveChange={onWaveChange}
                setIsLoading={setIsLoading}
              />
            </div>
          </div>

          {/* {components[view]} */}
          <WaveDrop wave={wave} />
        </div>
      </div>
    </div>
  );
};

export default WaveDetailedDesktop;
