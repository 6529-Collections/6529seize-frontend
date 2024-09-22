import { AnimatePresence, motion } from "framer-motion";
import { Wave } from "../../../generated/models/Wave";
import WaveHeader from "./header/WaveHeader";
import WaveLeaderboard from "./leaderboard/WaveLeaderboard";
import WaveOutcomes from "./outcome/WaveOutcomes";
import WaveSpecs from "./specs/WaveSpecs";
import WaveGroups from "./groups/WaveGroups";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import WaveDetailedFollowers from "./followers/WaveDetailedFollowers";
import WaveDetailedContent from "./WaveDetailedContent";
import WaveRequiredMetadata from "./metadata/WaveRequiredMetadata";
import WaveRequiredTypes from "./types/WaveRequiredTypes";
import { WaveDetailedView } from "./WaveDetailed";

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
  const router = useRouter();
  const searchParams = useSearchParams();

  const getActiveDropId = (): string | null => {
    const dropId = searchParams.get("drop");
    return dropId ?? null;
  };

  const [activeDropId, setActiveDropId] = useState<string | null>(
    getActiveDropId()
  );
  useEffect(() => setActiveDropId(getActiveDropId()), [searchParams]);

  const onBackToList = () => {
    const updatedQuery = { ...router.query };
    delete updatedQuery.drop;
    router.replace(
      {
        pathname: router.pathname,
        query: updatedQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const contentWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = contentWrapperRef.current;

    if (container) {
      const rect = container.getBoundingClientRect();
      if (rect.top < 0) {
        container.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "center",
        });
      }
    }
  }, [activeDropId]);

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
        activeDropId={activeDropId}
        wave={wave}
        onBackToList={onBackToList}
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
    <div className="tailwind-scope tw-bg-black tw-min-h-screen">
      <div className="tw-mt-4 tw-pb-16 lg:tw-pb-20 tw-px-4 min-[1729px]:tw-max-w-[1280px] tw-mx-auto">
        <div className="tw-flex tw-items-start tw-justify-center tw-gap-x-4">
          <div className="tw-h-[calc(100vh-7.5rem)] tw-overflow-y-auto no-scrollbar tw-max-w-[20.5rem] tw-w-full">
            <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-y-4 tw-mb-4">
              <WaveHeader
                wave={wave}
                onFollowersClick={() => setView(WaveDetailedView.FOLLOWERS)}
              />
              <WaveSpecs wave={wave} />
              <WaveGroups wave={wave} />
              {showRequiredMetadata && <WaveRequiredMetadata wave={wave} />}
              {showRequiredTypes && <WaveRequiredTypes wave={wave} />}
              {false && (
                <>
                  <WaveLeaderboard wave={wave} />
                  <WaveOutcomes wave={wave} />
                </>
              )}
            </div>
          </div>
          <div className="tw-flex-1">
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
