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

  const rankStyles: {
    [key: number]: { container: string; icon: string };
    default: string;
  } = {
    0: {
      container:
        "tw-size-10 tw-rounded-xl tw-bg-gradient-to-b tw-from-[#E8D48A]/30 tw-to-iron-900 tw-flex tw-items-center tw-justify-center tw-shadow-lg tw-ring-1 tw-ring-[#E8D48A]/30",
      icon: "tw-text-[#E8D48A]",
    },
    1: {
      container:
        "tw-rounded-lg tw-bg-gradient-to-b tw-from-[#dddddd]/20 tw-to-iron-900 tw-size-10 tw-flex tw-items-center tw-justify-center tw-shadow-lg tw-ring-1 tw-ring-[#dddddd]/30",
      icon: "tw-text-[#dddddd]",
    },
    2: {
      container:
        "tw-rounded-lg tw-bg-gradient-to-b tw-from-[#CD7F32]/20 tw-to-iron-900 tw-size-10 tw-flex tw-items-center tw-justify-center tw-shadow-lg tw-ring-1 tw-ring-[#CD7F32]/30",
      icon: "tw-text-[#CD7F32]",
    },
    default:
      "tw-flex tw-items-center tw-justify-center tw-size-7 tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-iron-700/70",
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

  const [activeTab, setActiveTab] = useState("leaderboard");

  const isTabActive = (tab: string) => activeTab === tab;

  const getTabClasses = (tab: string) =>
    `tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-lg tw-transition-colors tw-duration-300 tw-ease-in-out tw-relative z-10 ${
      isTabActive(tab)
        ? "tw-text-iron-50"
        : "tw-text-iron-300 hover:tw-text-white"
    }`;

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

          <div className="tw-w-full tw-ml-[21.5rem] no-scrollbar tw-overflow-y-auto tw-h-[calc(100vh-102px)] tw-pb-6">
            <div className="tw-justify-center tw-inline-flex tw-items-center tw-p-1 tw-h-9 tw-bg-iron-950/80 tw-border tw-border-iron-800/60 tw-rounded-xl tw-relative tw-backdrop-blur-sm">
              <div
                className="tw-absolute tw-h-10 tw-bg-gradient-to-r tw-from-indigo-500/10 tw-via-indigo-500/5 tw-to-transparent tw-rounded-xl tw-transition-all tw-duration-300"
                style={{
                  width: "calc(50% - 4px)",
                  left: activeTab === "leaderboard" ? "2px" : "calc(50% + 2px)",
                }}
              />
              <a
                onClick={() => setActiveTab("leaderboard")}
                className={`tw-cursor-pointer tw-px-8 tw-py-2.5 tw-z-10 tw-transition-all tw-duration-200 ${
                  activeTab === "leaderboard"
                    ? "tw-text-white tw-font-medium"
                    : "tw-text-iron-400 hover:tw-text-iron-200"
                } tw-text-sm tw-tracking-wide`}
              >
                Leaderboard
              </a>
              <a
                onClick={() => setActiveTab("chat")}
                className={`tw-cursor-pointer tw-px-8 tw-py-2.5 tw-z-10 tw-transition-all tw-duration-200 ${
                  activeTab === "chat"
                    ? "tw-text-white tw-font-medium"
                    : "tw-text-iron-400 hover:tw-text-iron-200"
                } tw-text-sm tw-tracking-wide`}
              >
                Chat
              </a>
            </div>

            <div className="tw-mt-6 tw-rounded-xl tw-bg-gradient-to-br tw-from-indigo-500/10 tw-via-iron-900/95 tw-to-iron-900/90 tw-p-6 tw-backdrop-blur-sm">
              <div className="tw-flex tw-flex-col sm:tw-flex-row tw-justify-between tw-items-center tw-gap-5">
                <div className="tw-flex tw-items-center tw-gap-5">
                  <div className="tw-size-12 tw-rounded-xl tw-bg-iron-800/40 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-indigo-500/20">
                    <svg
                      className="tw-w-6 tw-h-6 tw-text-indigo-400"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M12 8v4l2.5 2.5M12 2v2m10 8a10 10 0 11-20 0 10 10 0 0120 0z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="tw-text-lg tw-font-medium tw-mb-1 tw-text-iron-50">
                      Time Remaining
                    </h2>
                    <p className="tw-text-sm tw-text-iron-400 tw-m-0">
                      Competition ends December 15, 2024
                    </p>
                  </div>
                </div>
                <div className="tw-flex tw-gap-3">
                  <div className="tw-group tw-bg-iron-950/60 tw-backdrop-blur-sm tw-px-5 tw-py-3 tw-rounded-xl tw-border tw-border-iron-800/40 hover:tw-border-indigo-500/30 tw-transition-colors">
                    <span className="tw-text-2xl tw-font-medium tw-text-iron-50 tw-tracking-tight tw-group-hover:tw-text-white">
                      01
                    </span>
                    <span className="tw-ml-2 tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-400 tw-font-medium">
                      Days
                    </span>
                  </div>
                  <div className="tw-group tw-bg-iron-950/60 tw-backdrop-blur-sm tw-px-5 tw-py-3 tw-rounded-xl tw-border tw-border-iron-800/40 hover:tw-border-indigo-500/30 tw-transition-colors">
                    <span className="tw-text-2xl tw-font-medium tw-text-iron-50 tw-tracking-tight tw-group-hover:tw-text-white">
                      02
                    </span>
                    <span className="tw-ml-2 tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-400 tw-font-medium">
                      Hrs
                    </span>
                  </div>
                  <div className="tw-group tw-bg-iron-950/60 tw-backdrop-blur-sm tw-px-5 tw-py-3 tw-rounded-xl tw-border tw-border-iron-800/40 hover:tw-border-indigo-500/30 tw-transition-colors">
                    <span className="tw-text-2xl tw-font-medium tw-text-iron-50 tw-tracking-tight tw-group-hover:tw-text-white">
                      45
                    </span>
                    <span className="tw-ml-2 tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-400 tw-font-medium">
                      Min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="tw-mt-8 tw-flex tw-items-center tw-justify-between tw-mb-6">
              <div>
                <h3 className="tw-text-xl tw-font-medium tw-text-iron-50 tw-mb-1">
                  Leaderboard
                </h3>
                <p className="tw-text-sm tw-text-iron-400 tw-mb-0">
                  Ranked by community ratings
                </p>
              </div>
              <div className="tw-flex tw-items-center tw-gap-x-6">
                <button className="tw-group tw-border-0 tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-rounded-xl tw-bg-transparent tw-text-iron-300 hover:tw-bg-iron-950 tw-transition-all tw-duration-200">
                  <svg
                    className="tw-w-4 tw-h-4 tw-flex-shrink-0 tw-text-indigo-400 tw-group-hover:tw-text-indigo-300"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  My Work
                </button>
                <div className="tw-flex tw-items-center tw-gap-x-2">
                  <button className="tw-border-0 tw-px-4 tw-py-1.5 tw-text-sm tw-font-medium tw-rounded-lg tw-bg-iron-800/80 tw-text-iron-200">
                    Top Rated
                  </button>
                  <button className="tw-bg-transparent tw-border-0 tw-px-4 tw-py-1.5 tw-text-sm tw-font-medium tw-rounded-lg tw-text-iron-400 hover:tw-text-iron-200 hover:tw-bg-iron-950 tw-transition-colors">
                    Recent
                  </button>
                </div>
              </div>
            </div>

            <div className="tw-space-y-4">
              <div className="tw-group">
                <div className="tw-rounded-xl tw-bg-gradient-to-b tw-from-[#E8D48A]/15 tw-to-iron-900/80 hover:tw-from-[#E8D48A]/30 tw-p-[1px] tw-transition tw-duration-300 tw-ease-out">
                  <div className="tw-rounded-xl tw-bg-iron-950/95 tw-backdrop-blur-xl tw-p-6">
                    <div className="tw-flex tw-gap-6">
                      {/* Rank Indicator */}
                      <div className="tw-flex tw-flex-col tw-items-center tw-gap-2 tw-w-12">
                        <div className={rankStyles[0].container}>
                          <svg
                            className={`tw-size-5 ${rankStyles[0].icon}`}
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 576 512"
                          >
                            <path
                              fill="currentColor"
                              d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                            />
                          </svg>
                        </div>
                        <span className="tw-text-[#E8D48A] tw-font-semibold tw-text-sm">
                          1st
                        </span>
                      </div>

                      {/* Content */}
                      <div className="tw-flex-1">
                        {/* Header Section */}
                        <div className="tw-flex tw-justify-between tw-items-start tw-mb-5">
                          <div className="tw-flex tw-items-center tw-gap-3">
                            <div className="tw-relative">
                              <img
                                className="tw-size-8 tw-rounded-lg tw-ring-2 tw-ring-[#E8D48A]/20 tw-object-cover"
                                src="https://avatars.githubusercontent.com/u/10000000?v=4"
                                alt="User avatar"
                              />
                            </div>
                            <div>
                              <div className="tw-flex tw-items-center tw-gap-x-2">
                                <span className="tw-text-md tw-font-semibold tw-text-iron-100">
                                  crypto_wizard
                                </span>
                                <div className="tw-relative">
                                  <div className="tw-size-5 tw-flex tw-items-center tw-justify-center tw-leading-3 tw-font-bold tw-rounded-full tw-bg-gradient-to-br tw-from-iron-800 tw-to-iron-900 tw-ring-1 tw-ring-iron-700 tw-ring-inset">
                                    <span className="tw-text-[10px] tw-text-iron-200">
                                      45
                                    </span>
                                  </div>
                                  <div className="tw-absolute -tw-top-0.5 -tw-right-0.5 tw-size-2 tw-bg-[#3CCB7F] tw-rounded-full"></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Rating Section */}

                          <div className="tw-flex tw-items-center tw-gap-6">
                            <div className="tw-px-4 tw-py-1.5 tw-rounded-xl tw-bg-iron-900/80 tw-ring-1 tw-ring-iron-700/50 tw-backdrop-blur-sm">
                              <div className="tw-flex tw-items-center tw-gap-x-2">
                                <span className="tw-text-sm tw-font-normal tw-text-iron-400">
                                  1,234 raters
                                </span>
                                <div className="tw-size-1 tw-bg-iron-700 tw-rounded-full"></div>
                                {/* COLOR ACCORDING TO RANK */}
                                <span className="tw-text-sm tw-font-normal tw-text-[#E8D48A]">
                                  1,234{" "}
                                  <span className="tw-text-iron-400">
                                    {" "}
                                    ratings
                                  </span>
                                </span>
                              </div>
                            </div>

                            <div className="tw-flex tw-items-center tw-gap-x-2">
                              <button className="tw-border-0 tw-flex tw-items-center tw-justify-center tw-size-8 tw-rounded-xl tw-bg-iron-900/80 tw-ring-1 tw-ring-iron-700/50 hover:tw-ring-iron-600/50 tw-text-iron-300 hover:tw-text-iron-200 tw-transition-all tw-duration-300">
                                <svg
                                  className="tw-w-4 tw-h-4 tw-flex-shrink-0 tw-transition-transform tw-duration-300 tw-group-hover/btn:-tw-translate-y-0.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <path
                                    d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                              <svg
                                className="tw-size-5 -tw-mt-0.5"
                                id="clap--icon-672c9d44f92440a3a313a608"
                                viewBox="0 0 346 360"
                                fill="none"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M324.352 122.5C322.144 117.113 318.416 112.485 313.623 109.181C308.83 105.876 303.179 104.038 297.359 103.889C291.539 103.741 285.802 105.289 280.847 108.345C275.891 111.401 271.933 115.833 269.453 121.1L266.753 111.1C264.793 106.435 261.685 102.342 257.718 99.2012C253.751 96.0603 249.055 93.9736 244.065 93.1353C239.075 92.2971 233.955 92.7344 229.179 94.4067C224.404 96.079 220.129 98.9319 216.753 102.7L188.153 73.9C182.154 68.2244 174.21 65.0617 165.953 65.0617C157.695 65.0617 149.751 68.2244 143.753 73.9C143.477 74.3177 143.176 74.7184 142.853 75.1L130.453 62.7C124.478 56.979 116.525 53.7856 108.253 53.7856C99.9803 53.7856 92.0275 56.979 86.0525 62.7C82.3337 66.5873 79.6216 71.3248 78.1525 76.5L77.1525 75.5C71.1544 69.8244 63.2102 66.6617 54.9525 66.6617C46.6948 66.6617 38.7507 69.8244 32.7525 75.5C26.9143 81.414 23.6407 89.3897 23.6407 97.7C23.6407 106.01 26.9143 113.986 32.7525 119.9L33.8525 120.9C28.6832 122.313 23.9649 125.034 20.1525 128.8C17.2167 131.694 14.8854 135.142 13.2941 138.944C11.7029 142.747 10.8834 146.828 10.8834 150.95C10.8834 155.072 11.7029 159.153 13.2941 162.956C14.8854 166.758 17.2167 170.206 20.1525 173.1L23.3525 176.3C18.0255 177.52 13.1223 180.144 9.15252 183.9C3.29018 189.801 0 197.782 0 206.1C0 214.418 3.29018 222.399 9.15252 228.3L101.253 320.4C109.949 329.081 120.272 335.962 131.632 340.646C142.992 345.331 155.165 347.728 167.453 347.7C171.465 347.683 175.473 347.415 179.453 346.9C193.503 354.891 209.388 359.095 225.553 359.1C249.74 358.938 273.075 350.143 291.353 334.3L322.453 303.9C335.917 290.393 343.989 272.436 345.153 253.4C347.753 209.5 336.752 165.1 324.352 122.5ZM155.153 85.7C158.069 82.9359 161.934 81.3952 165.953 81.3952C169.971 81.3952 173.836 82.9359 176.753 85.7L209.153 118.2C209.057 119.665 209.057 121.135 209.153 122.6V141.6L154.453 86.9C154.658 86.4842 154.892 86.0833 155.153 85.7ZM112.653 309.4L20.5525 217.3C19.1254 215.887 17.9926 214.205 17.2195 212.351C16.4464 210.497 16.0483 208.508 16.0483 206.5C16.0483 204.492 16.4464 202.503 17.2195 200.649C17.9926 198.795 19.1254 197.113 20.5525 195.7C23.4573 192.913 27.327 191.357 31.3525 191.357C35.378 191.357 39.2477 192.913 42.1525 195.7L92.1525 245.7C93.6817 247.179 95.7255 248.005 97.8525 248.005C99.9796 248.005 102.023 247.179 103.553 245.7C105.055 244.183 105.898 242.135 105.898 240C105.898 237.865 105.055 235.817 103.553 234.3L31.6525 162.4C30.1126 160.989 28.882 159.274 28.0386 157.364C27.1952 155.453 26.7573 153.388 26.7525 151.3C26.7422 149.281 27.1449 147.282 27.936 145.424C28.727 143.567 29.8897 141.891 31.3525 140.5C34.2203 137.642 38.1039 136.037 42.1525 136.037C46.2012 136.037 50.0847 137.642 52.9525 140.5L124.853 212.5C126.382 213.979 128.425 214.805 130.553 214.805C132.68 214.805 134.723 213.979 136.253 212.5C137.755 210.983 138.598 208.935 138.598 206.8C138.598 204.665 137.755 202.617 136.253 201.1L44.0525 108.9C42.6171 107.493 41.4791 105.812 40.7061 103.957C39.9331 102.102 39.5408 100.11 39.5525 98.1C39.5497 96.0766 39.9457 94.0725 40.7179 92.2022C41.49 90.3319 42.6231 88.6321 44.0525 87.2C46.969 84.4359 50.8343 82.8952 54.8525 82.8952C58.8708 82.8952 62.7361 84.4359 65.6525 87.2L85.6525 107.2L157.453 179.1C159.007 180.376 160.98 181.028 162.989 180.929C164.997 180.83 166.897 179.988 168.319 178.566C169.741 177.144 170.583 175.245 170.682 173.236C170.78 171.228 170.128 169.254 168.853 167.7L96.9525 95.8C95.5254 94.3867 94.3926 92.7045 93.6195 90.8508C92.8464 88.9971 92.4483 87.0085 92.4483 85C92.4483 82.9915 92.8464 81.0029 93.6195 79.1492C94.3926 77.2955 95.5254 75.6133 96.9525 74.2C99.8499 71.36 103.745 69.7692 107.803 69.7692C111.86 69.7692 115.755 71.36 118.653 74.2L210.753 166.3C211.896 167.407 213.337 168.157 214.9 168.459C216.462 168.761 218.079 168.601 219.553 168C221.001 167.377 222.236 166.345 223.106 165.031C223.977 163.716 224.445 162.176 224.453 160.6V122.5C224.441 121.005 224.677 119.518 225.153 118.1C226.003 115.246 227.742 112.737 230.115 110.939C232.489 109.141 235.375 108.146 238.353 108.1C241.037 108.088 243.67 108.832 245.952 110.247C248.233 111.662 250.07 113.69 251.253 116.1C257.253 137.6 262.053 156.1 265.753 174.2C270.301 195.955 272.082 218.198 271.053 240.4C270.174 255.513 263.725 269.764 252.952 280.4L222.753 311.6C210.687 322.275 195.786 329.222 179.853 331.6C167.693 333.518 155.251 332.504 143.563 328.642C131.874 324.781 121.277 318.184 112.653 309.4ZM329.153 252C328.191 267.092 321.755 281.315 311.053 292L280.452 322.9C270.299 331.772 258.128 338.024 245.002 341.109C231.877 344.195 218.195 344.02 205.153 340.6C215.476 336.576 225.096 330.94 233.653 323.9L264.653 292.8C278.254 279.337 286.378 261.308 287.453 242.2C288.57 218.96 286.722 195.673 281.953 172.9L282.553 133.9C282.539 132.032 282.897 130.179 283.606 128.45C284.315 126.721 285.361 125.151 286.682 123.829C288.003 122.508 289.574 121.463 291.303 120.754C293.032 120.045 294.884 119.687 296.753 119.7C299.396 119.697 301.986 120.448 304.217 121.865C306.449 123.282 308.23 125.306 309.352 127.7C321.152 169.8 331.653 211 329.153 252ZM123.753 40.6C124.488 41.3551 125.365 41.958 126.333 42.3742C127.302 42.7904 128.343 43.0117 129.396 43.0257C130.45 43.0396 131.497 42.8458 132.476 42.4553C133.455 42.0649 134.347 41.4854 135.103 40.75C135.858 40.0146 136.46 39.1377 136.877 38.1693C137.293 37.2009 137.514 36.16 137.528 35.1061C137.542 34.0521 137.348 33.0058 136.958 32.0267C136.567 31.0477 135.988 30.1551 135.253 29.4L118.353 11.8C116.821 10.4934 114.858 9.80382 112.846 9.8657C110.834 9.92758 108.917 10.7365 107.469 12.1347C106.021 13.533 105.145 15.4204 105.013 17.429C104.88 19.4377 105.5 21.4237 106.753 23L123.753 40.6ZM163.753 36C165.874 36 167.909 35.1571 169.409 33.6568C170.91 32.1566 171.753 30.1217 171.753 28V8C171.753 5.87827 170.91 3.84344 169.409 2.34314C167.909 0.842853 165.874 0 163.753 0C161.631 0 159.596 0.842853 158.096 2.34314C156.595 3.84344 155.753 5.87827 155.753 8V28C155.751 30.0708 156.553 32.0614 157.989 33.5534C159.425 35.0453 161.383 35.9223 163.453 36H163.753ZM197.553 43C199.644 42.9757 201.648 42.1529 203.153 40.7L219.853 23.9C221.247 22.3908 222.007 20.4029 221.975 18.3485C221.944 16.2941 221.123 14.3305 219.683 12.8649C218.243 11.3992 216.294 10.5437 214.241 10.4758C212.187 10.4079 210.186 11.1327 208.653 12.5L191.653 29.1C190.9 29.8358 190.301 30.7146 189.893 31.6849C189.484 32.6552 189.274 33.6973 189.274 34.75C189.274 35.8027 189.484 36.8448 189.893 37.8151C190.301 38.7854 190.9 39.6642 191.653 40.4C192.36 41.1917 193.221 41.8306 194.184 42.2777C195.147 42.7247 196.191 42.9705 197.253 43H197.553Z"
                                  fill="currentColor"
                                ></path>
                              </svg>
                              <button className="tw-border-0 tw-flex tw-items-center tw-justify-center tw-size-8 tw-rounded-xl tw-bg-iron-900/80 tw-ring-1 tw-ring-iron-700/50 hover:tw-ring-iron-600/50 tw-text-iron-300 hover:tw-text-iron-200 tw-transition-all tw-duration-300">
                                <svg
                                  className="tw-w-4 tw-h-4 tw-flex-shrink-0 tw-transition-transform tw-duration-300 tw-group-hover/btn:tw-translate-y-0.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <path
                                    d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="tw-relative tw-mb-5">
                          <img
                            src="https://picsum.photos/800/400"
                            alt="Submission preview"
                            className="tw-w-full tw-aspect-video tw-object-cover tw-rounded-lg tw-ring-1 tw-ring-iron-700/50"
                          />
                        </div>

                        <div className="tw-relative tw-mb-5">
                          <p className="tw-text-md tw-mb-0 tw-font-normal tw-leading-relaxed tw-text-iron-300">
                            Building scalable solutions for next-generation web
                            applications with focus on performance and security.
                            Implementing advanced caching strategies and
                            optimization techniques.
                          </p>
                          <div className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-24 tw-bg-gradient-to-t tw-from-iron-950 tw-to-transparent"></div>
                          <button className="tw-border-0 tw-absolute tw-bottom-2 tw-left-1/2 -tw-translate-x-1/2 tw-px-4 tw-py-1.5 tw-text-sm tw-font-medium tw-rounded-full tw-bg-iron-900/80 tw-text-iron-300 hover:tw-bg-iron-800/80 hover:tw-text-iron-200 tw-backdrop-blur-sm tw-transition-all tw-flex tw-items-center tw-gap-1.5">
                            Show more
                            <svg
                              className="tw-w-4 tw-h-4 tw-flex-shrink-0"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              fill="none"
                            >
                              <path
                                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>

                        <div className="tw-flex tw-items-center tw-gap-6 tw-pt-4 ">
                          <div className="tw-flex tw-items-center tw-gap-x-2">
                            <svg
                              className="tw-w-4 tw-h-4 tw-text-blue-400 tw-flex-shrink-0"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              fill="none"
                            >
                              <path
                                d="M9 6.75H15M9 12H15M9 17.25H12M3.75 19.5H20.25C21.0784 19.5 21.75 18.8284 21.75 18V6C21.75 5.17157 21.0784 4.5 20.25 4.5H3.75C2.92157 4.5 2.25 5.17157 2.25 6V18C2.25 18.8284 2.92157 19.5 3.75 19.5Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span className="tw-text-blue-400 tw-font-medium tw-text-sm">
                              150 NIC
                            </span>
                          </div>
                          <div className="tw-flex tw-items-center tw-gap-x-2">
                            <svg
                              className="tw-w-4 tw-h-4 tw-text-emerald-400 tw-flex-shrink-0"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              fill="none"
                            >
                              <path
                                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                            </svg>
                            <span className="tw-text-emerald-400 tw-font-medium tw-text-sm">
                              15K Rep
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drops starting from rank 4, 5... etc places */}
              <div className="tw-group">
                <div className="tw-rounded-xl tw-bg-gradient-to-b tw-from-iron-900/40 tw-to-iron-900/20 tw-p-[1px]">
                  <div className="tw-rounded-xl tw-bg-iron-950/95 tw-backdrop-blur-xl tw-p-6">
                    <div className="tw-flex tw-gap-5">
                      {/* Rank Indicator - Simplified */}
                      <div className="tw-flex tw-flex-col tw-items-center tw-gap-2 tw-w-12">
                        <div className="tw-size-8 tw-rounded-lg tw-bg-iron-800/80 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-iron-700/50">
                          <span className="tw-text-base tw-font-semibold tw-text-iron-300">
                            4
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="tw-flex-1">
                        {/* Header with User Info */}
                        <div className="tw-flex tw-justify-between tw-items-start tw-mb-4">
                          <div className="tw-flex tw-items-center tw-gap-3">
                            <img
                              className="tw-size-8 tw-rounded-lg tw-ring-2 tw-ring-iron-700/30"
                              src="https://avatars.githubusercontent.com/u/10000003?v=4"
                              alt="User avatar"
                            />
                            <div className="tw-flex tw-items-center tw-gap-x-2">
                              <span className="tw-text-base tw-font-semibold tw-text-iron-200">
                                user_3
                              </span>
                              <div className="tw-relative">
                                <div className="tw-size-5 tw-flex tw-items-center tw-justify-center tw-leading-3 tw-font-bold tw-rounded-full tw-bg-gradient-to-br tw-from-iron-800 tw-to-iron-900 tw-ring-1 tw-ring-iron-700 tw-ring-inset">
                                  <span className="tw-text-[10px] tw-text-iron-200">
                                    45
                                  </span>
                                </div>
                                <div className="tw-absolute -tw-top-0.5 -tw-right-0.5 tw-size-2 tw-bg-[#3CCB7F] tw-rounded-full"></div>
                              </div>
                            </div>
                          </div>

                          <div className="tw-flex tw-items-center tw-gap-6">
                            <div className="tw-px-4 tw-py-1.5 tw-rounded-xl tw-bg-iron-900/80 tw-ring-1 tw-ring-iron-700/50 tw-backdrop-blur-sm">
                              <div className="tw-flex tw-items-center tw-gap-x-2">
                                <span className="tw-text-sm tw-font-normal tw-text-iron-400">
                                  1,234 raters
                                </span>
                                <div className="tw-size-1 tw-bg-iron-700 tw-rounded-full"></div>
                                {/* COLOR ACCORDING TO RANK */}
                                <span className="tw-text-sm tw-font-normal tw-text-iron-300">
                                  1,234{" "}
                                  <span className="tw-text-iron-400">
                                    {" "}
                                    ratings
                                  </span>
                                </span>
                              </div>
                            </div>

                            <div className="tw-flex tw-items-center tw-gap-x-2">
                              <button className="tw-border-0 tw-flex tw-items-center tw-justify-center tw-size-8 tw-rounded-xl tw-bg-iron-900/80 tw-ring-1 tw-ring-iron-700/50 hover:tw-ring-iron-600/50 tw-text-iron-300 hover:tw-text-iron-200 tw-transition-all tw-duration-300">
                                <svg
                                  className="tw-w-4 tw-h-4 tw-flex-shrink-0 tw-transition-transform tw-duration-300 tw-group-hover/btn:-tw-translate-y-0.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <path
                                    d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                              <svg
                                className="tw-size-5 -tw-mt-0.5"
                                id="clap--icon-672c9d44f92440a3a313a608"
                                viewBox="0 0 346 360"
                                fill="none"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M324.352 122.5C322.144 117.113 318.416 112.485 313.623 109.181C308.83 105.876 303.179 104.038 297.359 103.889C291.539 103.741 285.802 105.289 280.847 108.345C275.891 111.401 271.933 115.833 269.453 121.1L266.753 111.1C264.793 106.435 261.685 102.342 257.718 99.2012C253.751 96.0603 249.055 93.9736 244.065 93.1353C239.075 92.2971 233.955 92.7344 229.179 94.4067C224.404 96.079 220.129 98.9319 216.753 102.7L188.153 73.9C182.154 68.2244 174.21 65.0617 165.953 65.0617C157.695 65.0617 149.751 68.2244 143.753 73.9C143.477 74.3177 143.176 74.7184 142.853 75.1L130.453 62.7C124.478 56.979 116.525 53.7856 108.253 53.7856C99.9803 53.7856 92.0275 56.979 86.0525 62.7C82.3337 66.5873 79.6216 71.3248 78.1525 76.5L77.1525 75.5C71.1544 69.8244 63.2102 66.6617 54.9525 66.6617C46.6948 66.6617 38.7507 69.8244 32.7525 75.5C26.9143 81.414 23.6407 89.3897 23.6407 97.7C23.6407 106.01 26.9143 113.986 32.7525 119.9L33.8525 120.9C28.6832 122.313 23.9649 125.034 20.1525 128.8C17.2167 131.694 14.8854 135.142 13.2941 138.944C11.7029 142.747 10.8834 146.828 10.8834 150.95C10.8834 155.072 11.7029 159.153 13.2941 162.956C14.8854 166.758 17.2167 170.206 20.1525 173.1L23.3525 176.3C18.0255 177.52 13.1223 180.144 9.15252 183.9C3.29018 189.801 0 197.782 0 206.1C0 214.418 3.29018 222.399 9.15252 228.3L101.253 320.4C109.949 329.081 120.272 335.962 131.632 340.646C142.992 345.331 155.165 347.728 167.453 347.7C171.465 347.683 175.473 347.415 179.453 346.9C193.503 354.891 209.388 359.095 225.553 359.1C249.74 358.938 273.075 350.143 291.353 334.3L322.453 303.9C335.917 290.393 343.989 272.436 345.153 253.4C347.753 209.5 336.752 165.1 324.352 122.5ZM155.153 85.7C158.069 82.9359 161.934 81.3952 165.953 81.3952C169.971 81.3952 173.836 82.9359 176.753 85.7L209.153 118.2C209.057 119.665 209.057 121.135 209.153 122.6V141.6L154.453 86.9C154.658 86.4842 154.892 86.0833 155.153 85.7ZM112.653 309.4L20.5525 217.3C19.1254 215.887 17.9926 214.205 17.2195 212.351C16.4464 210.497 16.0483 208.508 16.0483 206.5C16.0483 204.492 16.4464 202.503 17.2195 200.649C17.9926 198.795 19.1254 197.113 20.5525 195.7C23.4573 192.913 27.327 191.357 31.3525 191.357C35.378 191.357 39.2477 192.913 42.1525 195.7L92.1525 245.7C93.6817 247.179 95.7255 248.005 97.8525 248.005C99.9796 248.005 102.023 247.179 103.553 245.7C105.055 244.183 105.898 242.135 105.898 240C105.898 237.865 105.055 235.817 103.553 234.3L31.6525 162.4C30.1126 160.989 28.882 159.274 28.0386 157.364C27.1952 155.453 26.7573 153.388 26.7525 151.3C26.7422 149.281 27.1449 147.282 27.936 145.424C28.727 143.567 29.8897 141.891 31.3525 140.5C34.2203 137.642 38.1039 136.037 42.1525 136.037C46.2012 136.037 50.0847 137.642 52.9525 140.5L124.853 212.5C126.382 213.979 128.425 214.805 130.553 214.805C132.68 214.805 134.723 213.979 136.253 212.5C137.755 210.983 138.598 208.935 138.598 206.8C138.598 204.665 137.755 202.617 136.253 201.1L44.0525 108.9C42.6171 107.493 41.4791 105.812 40.7061 103.957C39.9331 102.102 39.5408 100.11 39.5525 98.1C39.5497 96.0766 39.9457 94.0725 40.7179 92.2022C41.49 90.3319 42.6231 88.6321 44.0525 87.2C46.969 84.4359 50.8343 82.8952 54.8525 82.8952C58.8708 82.8952 62.7361 84.4359 65.6525 87.2L85.6525 107.2L157.453 179.1C159.007 180.376 160.98 181.028 162.989 180.929C164.997 180.83 166.897 179.988 168.319 178.566C169.741 177.144 170.583 175.245 170.682 173.236C170.78 171.228 170.128 169.254 168.853 167.7L96.9525 95.8C95.5254 94.3867 94.3926 92.7045 93.6195 90.8508C92.8464 88.9971 92.4483 87.0085 92.4483 85C92.4483 82.9915 92.8464 81.0029 93.6195 79.1492C94.3926 77.2955 95.5254 75.6133 96.9525 74.2C99.8499 71.36 103.745 69.7692 107.803 69.7692C111.86 69.7692 115.755 71.36 118.653 74.2L210.753 166.3C211.896 167.407 213.337 168.157 214.9 168.459C216.462 168.761 218.079 168.601 219.553 168C221.001 167.377 222.236 166.345 223.106 165.031C223.977 163.716 224.445 162.176 224.453 160.6V122.5C224.441 121.005 224.677 119.518 225.153 118.1C226.003 115.246 227.742 112.737 230.115 110.939C232.489 109.141 235.375 108.146 238.353 108.1C241.037 108.088 243.67 108.832 245.952 110.247C248.233 111.662 250.07 113.69 251.253 116.1C257.253 137.6 262.053 156.1 265.753 174.2C270.301 195.955 272.082 218.198 271.053 240.4C270.174 255.513 263.725 269.764 252.952 280.4L222.753 311.6C210.687 322.275 195.786 329.222 179.853 331.6C167.693 333.518 155.251 332.504 143.563 328.642C131.874 324.781 121.277 318.184 112.653 309.4ZM329.153 252C328.191 267.092 321.755 281.315 311.053 292L280.452 322.9C270.299 331.772 258.128 338.024 245.002 341.109C231.877 344.195 218.195 344.02 205.153 340.6C215.476 336.576 225.096 330.94 233.653 323.9L264.653 292.8C278.254 279.337 286.378 261.308 287.453 242.2C288.57 218.96 286.722 195.673 281.953 172.9L282.553 133.9C282.539 132.032 282.897 130.179 283.606 128.45C284.315 126.721 285.361 125.151 286.682 123.829C288.003 122.508 289.574 121.463 291.303 120.754C293.032 120.045 294.884 119.687 296.753 119.7C299.396 119.697 301.986 120.448 304.217 121.865C306.449 123.282 308.23 125.306 309.352 127.7C321.152 169.8 331.653 211 329.153 252ZM123.753 40.6C124.488 41.3551 125.365 41.958 126.333 42.3742C127.302 42.7904 128.343 43.0117 129.396 43.0257C130.45 43.0396 131.497 42.8458 132.476 42.4553C133.455 42.0649 134.347 41.4854 135.103 40.75C135.858 40.0146 136.46 39.1377 136.877 38.1693C137.293 37.2009 137.514 36.16 137.528 35.1061C137.542 34.0521 137.348 33.0058 136.958 32.0267C136.567 31.0477 135.988 30.1551 135.253 29.4L118.353 11.8C116.821 10.4934 114.858 9.80382 112.846 9.8657C110.834 9.92758 108.917 10.7365 107.469 12.1347C106.021 13.533 105.145 15.4204 105.013 17.429C104.88 19.4377 105.5 21.4237 106.753 23L123.753 40.6ZM163.753 36C165.874 36 167.909 35.1571 169.409 33.6568C170.91 32.1566 171.753 30.1217 171.753 28V8C171.753 5.87827 170.91 3.84344 169.409 2.34314C167.909 0.842853 165.874 0 163.753 0C161.631 0 159.596 0.842853 158.096 2.34314C156.595 3.84344 155.753 5.87827 155.753 8V28C155.751 30.0708 156.553 32.0614 157.989 33.5534C159.425 35.0453 161.383 35.9223 163.453 36H163.753ZM197.553 43C199.644 42.9757 201.648 42.1529 203.153 40.7L219.853 23.9C221.247 22.3908 222.007 20.4029 221.975 18.3485C221.944 16.2941 221.123 14.3305 219.683 12.8649C218.243 11.3992 216.294 10.5437 214.241 10.4758C212.187 10.4079 210.186 11.1327 208.653 12.5L191.653 29.1C190.9 29.8358 190.301 30.7146 189.893 31.6849C189.484 32.6552 189.274 33.6973 189.274 34.75C189.274 35.8027 189.484 36.8448 189.893 37.8151C190.301 38.7854 190.9 39.6642 191.653 40.4C192.36 41.1917 193.221 41.8306 194.184 42.2777C195.147 42.7247 196.191 42.9705 197.253 43H197.553Z"
                                  fill="currentColor"
                                ></path>
                              </svg>
                              <button className="tw-border-0 tw-flex tw-items-center tw-justify-center tw-size-8 tw-rounded-xl tw-bg-iron-900/80 tw-ring-1 tw-ring-iron-700/50 hover:tw-ring-iron-600/50 tw-text-iron-300 hover:tw-text-iron-200 tw-transition-all tw-duration-300">
                                <svg
                                  className="tw-w-4 tw-h-4 tw-flex-shrink-0 tw-transition-transform tw-duration-300 tw-group-hover/btn:tw-translate-y-0.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <path
                                    d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="tw-relative tw-mb-4">
                          <p className="tw-text-md tw-mb-0 tw-fomt-normal tw-leading-relaxed tw-text-iron-300">
                            Implementing robust testing frameworks for smart
                            contract validation. Includes fuzzing and formal
                            verification approaches.
                          </p>
                        </div>

                        {/* Footer Metrics */}
                        <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-x-6 tw-gap-y-3 tw-text-sm">
                          <div className="tw-flex tw-items-center tw-gap-x-2 tw-whitespace-nowrap">
                            <svg
                              className="tw-w-4 tw-h-4 tw-text-blue-400"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M9 6.75H15M9 12H15M9 17.25H12M3.75 19.5H20.25C21.0784 19.5 21.75 18.8284 21.75 18V6C21.75 5.17157 21.0784 4.5 20.25 4.5H3.75C2.92157 4.5 2.25 5.17157 2.25 6V18C2.25 18.8284 2.92157 19.5 3.75 19.5Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span className="tw-text-blue-400 tw-font-medium">
                              100 NIC
                            </span>
                          </div>
                          <div className="tw-flex tw-items-center tw-gap-x-2 tw-whitespace-nowrap">
                            <svg
                              className="tw-w-4 tw-h-4 tw-text-emerald-400"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              fill="none"
                            >
                              <path
                                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                            </svg>
                            <span className="tw-text-emerald-400 tw-font-medium">
                              10K Rep
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
          {/*   {isNotChatWave && (
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
