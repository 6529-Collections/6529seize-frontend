import { AnimatePresence, motion } from "framer-motion";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import WaveDetailedFollowers from "./followers/WaveDetailedFollowers";
import WaveDetailedContent from "./WaveDetailedContent";
import { WaveDetailedView } from "./WaveDetailed";
import WaveDetailedAbout from "./WaveDetailedAbout";
import WaveDetailedRightSidebar from "./WaveDetailedRightSidebar";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";

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

  const contentWrapperRef = useRef<HTMLDivElement | null>(null);

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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const components: Record<WaveDetailedView, JSX.Element> = {
    [WaveDetailedView.CONTENT]: (
      <WaveDetailedContent
        key={`wave-detailed-content-${wave.id}`}
        wave={wave}
      />
    ),
    [WaveDetailedView.FOLLOWERS]: (
      <WaveDetailedFollowers
        wave={wave}
        onBackClick={() => setView(WaveDetailedView.CONTENT)}
      />
    ),
  };

  const showRightSidebar = wave.wave.type !== ApiWaveType.Chat;

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
          <div
            className={`tw-flex-1 tw-ml-[21.5rem] ${
              isSidebarOpen && showRightSidebar ? "tw-mr-[19.5rem]" : ""
            } tw-transition-all tw-duration-300`}
          >
            <div
              ref={contentWrapperRef}
              className="tw-rounded-xl tw-overflow-hidden tw-bg-iron-950 tw-ring-1 tw-ring-iron-800 tw-relative"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {showRightSidebar && (
                    <div className="tw-flex tw-space-x-2 tw-px-4 tw-py-1.5 tw-bg-iron-950/70 tw-backdrop-blur-md tw-border-solid tw-border-b tw-border-iron-800 tw-border-x-0 tw-border-t-0 tw-absolute tw-left-0 tw-right-0 tw-top-0 tw-z-10">
                      <button className="tw-px-3 tw-py-1.5 tw-border-0 tw-rounded-full tw-text-xs tw-font-medium tw-bg-primary-400 tw-text-white tw-shadow-sm hover:tw-bg-primary-500 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2 tw-transition-colors">
                        All
                      </button>
                      <button className="tw-px-3 tw-py-1.5 tw-border-0 tw-rounded-full tw-text-xs tw-font-medium tw-bg-iron-800 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2 tw-transition-colors">
                        Drops
                      </button>
                    </div>
                  )}
                  {components[view]}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          {showRightSidebar && (
            <WaveDetailedRightSidebar
              isOpen={isSidebarOpen}
              wave={wave}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WaveDetailedDesktop;
