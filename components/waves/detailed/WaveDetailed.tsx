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
import { AnimatePresence, motion } from "framer-motion";

enum WaveDetailedView {
  CONTENT = "CONTENT",
  CHAT = "CHAT",
  FOLLOWERS = "FOLLOWERS",
}

interface WaveDetailedProps {
  readonly wave: Wave;
}

export default function WaveDetailed({ wave }: WaveDetailedProps) {
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

  const [activeView, setActiveView] = useState<WaveDetailedView>(
    WaveDetailedView.CHAT
  );

  const components: Record<WaveDetailedView, JSX.Element> = {
    [WaveDetailedView.CONTENT]: (
      <WaveDetailedContent
        activeDropId={activeDropId}
        wave={wave}
        onBackToList={onBackToList}
      />
    ),
    [WaveDetailedView.CHAT]: (
      <div className="tw-p-4 tw-text-white">Chat component goes here</div>
    ),
    [WaveDetailedView.FOLLOWERS]: (
      <WaveDetailedFollowers
        wave={wave}
        onBackClick={() => setActiveView(WaveDetailedView.CHAT)}
      />
    ),
  };

  const renderLeftColumn = () => (
    <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-y-4 tw-mb-4">
      <WaveHeader
        wave={wave}
        onFollowersClick={() => setActiveView(WaveDetailedView.FOLLOWERS)}
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
  );

  if (!showWaves) {
    return null;
  }

  return (
    <div className="tailwind-scope tw-bg-black tw-min-h-screen">
      <div className="tw-mt-4 tw-pb-16 lg:tw-pb-20 tw-px-4 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
        <div className="tw-mb-4 md:tw-hidden">
          <div className="tw-flex tw-gap-x-3 lg:tw-gap-x-4">
            <button
              onClick={() => setActiveView(WaveDetailedView.CHAT)}
              className={`tw-bg-transparent tw-text-base tw-font-semibold tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-b-2 ${
                activeView === WaveDetailedView.CHAT
                  ? "tw-border-primary-400 tw-text-iron-100 tw-whitespace-nowrap tw-font-semibold tw-py-3 tw-px-1"
                  : "tw-border-transparent tw-text-iron-500 hover:tw-border-gray-300 hover:tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-py-3 tw-px-1 tw-transition tw-duration-300 tw-ease-out"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveView(WaveDetailedView.CONTENT)}
              className={`tw-bg-transparent tw-text-base tw-font-semibold tw-border-b-2 tw-border-solid tw-border-x-0 tw-border-t-0 ${
                activeView === WaveDetailedView.CONTENT
                  ? "tw-border-primary-400 tw-text-iron-100 tw-whitespace-nowrap tw-font-semibold tw-py-3 tw-px-1"
                  : "tw-border-transparent tw-text-iron-500 hover:tw-border-gray-300 hover:tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-py-3 tw-px-1 tw-transition tw-duration-300 tw-ease-out"
              }`}
            >
              About
            </button>
          </div>
        </div>
        <div className="tw-flex tw-items-start tw-justify-center tw-gap-x-4">
          <div
            className={`tw-h-[calc(100vh-160px)] tw-overflow-y-auto no-scrollbar md:tw-max-w-[20.5rem] tw-w-full ${
              activeView !== WaveDetailedView.CONTENT
                ? "tw-hidden md:tw-block"
                : ""
            }`}
          >
            {renderLeftColumn()}
          </div>

          <div
            className={`tw-flex-1 ${
              activeView === WaveDetailedView.CONTENT
                ? "tw-hidden md:tw-block"
                : ""
            }`}
          >
            <div
              ref={contentWrapperRef}
              className="tw-rounded-xl tw-overflow-hidden tw-bg-iron-950 tw-ring-1 tw-ring-iron-800"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {components[activeView]}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
