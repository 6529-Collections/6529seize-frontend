import { AnimatePresence, motion } from "framer-motion";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import WaveDetailedFollowers from "./followers/WaveDetailedFollowers";
import WaveDetailedContent from "./WaveDetailedContent";
import {
  WaveDetailedDropsSortBy,
  WaveDetailedDropsView,
  WaveDetailedView,
} from "./WaveDetailed";
import WaveDetailedAbout from "./WaveDetailedAbout";
import WaveDetailedRightSidebar from "./WaveDetailedRightSidebar";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";
import WaveDetailedDropsHeaderNav from "./WaveDetailedDropsHeaderNav";
import DropListItemRateGiveSubmit from "../../drops/view/item/rate/give/DropListItemRateGiveSubmit";
import DropListItemRateGiveChangeButton from "../../drops/view/item/rate/give/DropListItemRateGiveChangeButton";
import { WaveLeaderboard } from "./leaderboard/WaveLeaderboard";
import { WaveDrop } from "./drop/WaveDrop";

interface WaveDetailedDesktopProps {
  readonly wave: ApiWave;
  readonly view: WaveDetailedView;
  readonly dropsView: WaveDetailedDropsView;
  readonly dropsSortBy: WaveDetailedDropsSortBy;
  readonly setView: (view: WaveDetailedView) => void;
  readonly setDropsView: (view: WaveDetailedDropsView) => void;
  readonly setDropsSortBy: (sortBy: WaveDetailedDropsSortBy) => void;
  readonly onWaveChange: (wave: ApiWave) => void;
  readonly setIsLoading: (isLoading: boolean) => void;
}

const WaveDetailedDesktop: React.FC<WaveDetailedDesktopProps> = ({
  wave,
  view,
  dropsView,
  dropsSortBy,
  setView,
  setDropsView,
  setDropsSortBy,
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

  const trophyStyles = {
    0: {
      background:
        "tw-rounded-xl tw-bg-gradient-to-b tw-from-[#E8D48A]/20 tw-to-iron-900 tw-size-10 tw-flex tw-items-center tw-justify-center tw-shadow-lg tw-ring-1 tw-ring-[#E8D48A]/30",
      color: "tw-text-[#E8D48A]",
    },
    1: {
      background:
        "tw-rounded-xl tw-bg-gradient-to-b tw-from-[#dddddd]/20 tw-to-iron-900 tw-size-10 tw-flex tw-items-center tw-justify-center tw-shadow-lg tw-ring-1 tw-ring-[#dddddd]/30",
      color: "tw-text-[#dddddd]",
    },
    2: {
      background:
        "tw-rounded-xl tw-bg-gradient-to-b tw-from-[#CD7F32]/20 tw-to-iron-900 tw-size-10 tw-flex tw-items-center tw-justify-center tw-shadow-lg tw-ring-1 tw-ring-[#CD7F32]/30",
      color: "tw-text-[#CD7F32]",
    },
  };

  const components: Record<WaveDetailedView, JSX.Element> = {
    [WaveDetailedView.CONTENT]: (
      <WaveDetailedContent
        key={`wave-detailed-content-${wave.id}`}
        wave={wave}
        dropsView={dropsView}
        dropsSortBy={dropsSortBy}
      />
    ),
    [WaveDetailedView.FOLLOWERS]: (
      <WaveDetailedFollowers
        wave={wave}
        onBackClick={() => setView(WaveDetailedView.CONTENT)}
      />
    ),
  };

  const isNotChatWave = wave.wave.type !== ApiWaveType.Chat;

  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [showMoreButtons, setShowMoreButtons] = useState<boolean[]>([]);

  useEffect(() => {
    const checkContentHeights = () => {
      const newShowMoreButtons = contentRefs.current.map((ref) => {
        if (!ref) return false;
        return ref.scrollHeight > 300;
      });
      setShowMoreButtons(newShowMoreButtons);
    };

    checkContentHeights();
    window.addEventListener("resize", checkContentHeights);
    return () => window.removeEventListener("resize", checkContentHeights);
  }, []);

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

          {/* <WaveLeaderboard wave={wave} /> */}
          <WaveDrop wave={wave} />

          <div
            className={`tw-flex-1 tw-ml-[21.5rem] tw-hidden ${
              isSidebarOpen && isNotChatWave ? "tw-mr-[19.5rem]" : ""
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
                  {isNotChatWave && (
                    <WaveDetailedDropsHeaderNav
                      dropsView={dropsView}
                      setDropsView={setDropsView}
                      dropsSortBy={dropsSortBy}
                      setDropsSortBy={setDropsSortBy}
                    />
                  )}
                  {components[view]}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          {/* {isNotChatWave && (
            <WaveDetailedRightSidebar
              isOpen={isSidebarOpen}
              wave={wave}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          )}   */}
        </div>
      </div>
    </div>
  );
};

export default WaveDetailedDesktop;
