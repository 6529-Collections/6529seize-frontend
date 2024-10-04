import { AnimatePresence, motion } from "framer-motion";
import { Wave } from "../../../generated/models/Wave";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import WaveDetailedFollowers from "./followers/WaveDetailedFollowers";
import WaveDetailedContent from "./WaveDetailedContent";
import { WaveDetailedView } from "./WaveDetailed";
import WaveDetailedAbout from "./WaveDetailedAbout";

interface WaveDetailedDesktopProps {
  readonly wave: Wave;
  readonly view: WaveDetailedView;

  readonly setView: (view: WaveDetailedView) => void;
}

const WaveDetailedDesktop: React.FC<WaveDetailedDesktopProps> = ({
  wave,
  view,
  setView,
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

  if (!showWaves) {
    return null;
  }

  return (
    <div className="tailwind-scope tw-bg-black">
      <div className="tw-mt-3 tw-px-4">
        <div className="tw-flex tw-items-start tw-justify-center tw-gap-x-4">
          <div className="tw-fixed tw-inset-y-0 tw-left-0 tw-pl-3 tw-overflow-y-auto no-scrollbar tw-mt-28 lg:tw-w-[20.5rem] tw-w-full">
            <div className="tw-flex tw-flex-1 tw-flex-col">
              <WaveDetailedAbout
                wave={wave}
                setView={setView}
                showRequiredMetadata={showRequiredMetadata}
                showRequiredTypes={showRequiredTypes}
              />
            </div>
          </div>
          <div className="tw-flex-1 tw-ml-[20.5rem]">
            <div
              ref={contentWrapperRef}
              className="tw-rounded-xl tw-overflow-hidden tw-bg-iron-950 tw-ring-1 tw-ring-iron-800"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {components[view]}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaveDetailedDesktop;
