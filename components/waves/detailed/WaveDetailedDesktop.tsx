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
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { AnimatePresence, motion } from "framer-motion";

interface WaveDetailedDesktopProps {
  readonly wave: ApiWave;
  readonly view: WaveDetailedView;
  readonly activeDrop: ExtendedDrop | null;
  readonly setView: (view: WaveDetailedView) => void;
  readonly onWaveChange: (wave: ApiWave) => void;
  readonly setIsLoading: (isLoading: boolean) => void;
  readonly setActiveDrop: (drop: ExtendedDrop | null) => void;
}

const WaveDetailedDesktop: React.FC<WaveDetailedDesktopProps> = ({
  wave,
  view,
  setView,
  onWaveChange,
  setIsLoading,
  activeDrop,
  setActiveDrop,
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
      <WaveChat
        wave={wave}
        activeTab={view}
        setActiveTab={setView}
        onDropClick={setActiveDrop}
      />
    ),
    [WaveDetailedView.LEADERBOARD]: (
      <WaveLeaderboard wave={wave} setActiveDrop={setActiveDrop}>
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
      <div className="tw-pl-4">
        <div className="tw-flex tw-items-start tw-gap-x-4 tw-relative">
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
          <AnimatePresence>
            {activeDrop && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="tw-absolute tw-ml-[21.5rem] tw-inset-0 tw-z-1000"
              >
                <WaveDrop
                  wave={wave}
                  drop={activeDrop}
                  onClose={() => setActiveDrop(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {components[view]}
        </div>
      </div>
    </div>
  );
};

export default WaveDetailedDesktop;
