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

interface WaveDetailedMobileProps {
  readonly wave: Wave;
  readonly view: WaveDetailedView;
  readonly setView: (view: WaveDetailedView) => void;
}

enum WaveDetailedMobileView {
  CHAT = "CHAT",
  ABOUT = "ABOUT",
}

const WaveDetailedMobile: React.FC<WaveDetailedMobileProps> = ({
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

  const [activeView, setActiveView] = useState<WaveDetailedMobileView>(
    WaveDetailedMobileView.CHAT
  );

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

  const chatComponents: Record<WaveDetailedView, JSX.Element> = {
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

  const components: Record<WaveDetailedMobileView, JSX.Element> = {
    [WaveDetailedMobileView.CHAT]: chatComponents[view],
    [WaveDetailedMobileView.ABOUT]: (
      <div className="tw-px-4 md:tw-px-2">
        <div className="tw-h-[calc(100vh-10.75rem)] tw-overflow-y-auto no-scrollbar tw-space-y-4 tw-pb-4">
          <WaveHeader
            wave={wave}
            onFollowersClick={() => {
              setView(WaveDetailedView.FOLLOWERS);
              setActiveView(WaveDetailedMobileView.CHAT);
            }}
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
    ),
  };

  if (!showWaves) {
    return null;
  }

  return (
    <div className="tailwind-scope tw-bg-black">
      <div className="tw-mt-4 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
        <div className="tw-mb-4 tw-px-4 min-[992px]:tw-px-3">
          <div className="tw-flex tw-gap-x-3 lg:tw-gap-x-4">
            <button
              onClick={() => setActiveView(WaveDetailedMobileView.CHAT)}
              className={`tw-bg-transparent tw-text-base tw-font-semibold tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-b-2 ${
                activeView === WaveDetailedMobileView.CHAT
                  ? "tw-border-primary-400 tw-text-iron-100 tw-whitespace-nowrap tw-font-semibold tw-py-3 tw-px-1"
                  : "tw-border-transparent tw-text-iron-500 hover:tw-border-gray-300 hover:tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-py-3 tw-px-1 tw-transition tw-duration-300 tw-ease-out"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveView(WaveDetailedMobileView.ABOUT)}
              className={`tw-bg-transparent tw-text-base tw-font-semibold tw-border-b-2 tw-border-solid tw-border-x-0 tw-border-t-0 ${
                activeView === WaveDetailedMobileView.ABOUT
                  ? "tw-border-primary-400 tw-text-iron-100 tw-whitespace-nowrap tw-font-semibold tw-py-3 tw-px-1"
                  : "tw-border-transparent tw-text-iron-500 hover:tw-border-gray-300 hover:tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-py-3 tw-px-1 tw-transition tw-duration-300 tw-ease-out"
              }`}
            >
              About
            </button>
          </div>
        </div>
        <div className="lg:tw-flex lg:tw-items-start lg:tw-justify-center lg:tw-gap-x-4 min-[992px]:tw-px-3">
          {components[activeView]}
        </div>
      </div>
    </div>
  );
};

export default WaveDetailedMobile;
