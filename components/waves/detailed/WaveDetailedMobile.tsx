import { Wave } from "../../../generated/models/Wave";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import WaveDetailedFollowers from "./followers/WaveDetailedFollowers";
import WaveDetailedContent from "./WaveDetailedContent";
import { WaveDetailedView } from "./WaveDetailed";
import WaveDetailedMobileAbout from "./WaveDetailedMobileAbout";

interface WaveDetailedMobileProps {
  readonly wave: Wave;
  readonly view: WaveDetailedView;
  readonly setView: (view: WaveDetailedView) => void;
}

export enum WaveDetailedMobileView {
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

  const [activeView, setActiveView] = useState<WaveDetailedMobileView>(
    WaveDetailedMobileView.CHAT
  );

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
    [WaveDetailedView.CONTENT]: <WaveDetailedContent wave={wave} />,
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
      <WaveDetailedMobileAbout
        wave={wave}
        showRequiredMetadata={showRequiredMetadata}
        showRequiredTypes={showRequiredTypes}
        setView={setView}
        setActiveView={setActiveView}
      />
    ),
  };

  if (!showWaves) {
    return null;
  }

  return (
    <div className="tailwind-scope tw-bg-black">
      <div className="tw-px-4 min-[992px]:tw-px-3 tw-flex tw-gap-x-3 lg:tw-gap-x-4 tw-border-b tw-border-iron-800 tw-border-solid tw-border-t-0 tw-border-x-0">
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
      <div className="lg:tw-flex lg:tw-items-start lg:tw-justify-center lg:tw-gap-x-4">
        {components[activeView]}
      </div>
    </div>
  );
};

export default WaveDetailedMobile;
