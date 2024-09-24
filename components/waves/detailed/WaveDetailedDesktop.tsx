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

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

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
    <div className="tailwind-scope tw-bg-black">
      <div className="tw-mt-3 tw-px-4">
        <div className="tw-flex tw-items-start tw-justify-center tw-gap-x-4">
          <div className="tw-fixed tw-inset-y-0 tw-left-0 tw-pl-3 tw-overflow-y-auto no-scrollbar tw-mt-28 lg:tw-w-[20.5rem] tw-w-full">
            <div className="tw-flex tw-flex-1 tw-flex-col">
              <WaveHeader
                wave={wave}
                onFollowersClick={() => setView(WaveDetailedView.FOLLOWERS)}
              />

              <button
                onClick={toggleExpand}
                type="button"
                className={`tw-w-full tw-group tw-mt-4 tw-ring-1 tw-ring-iron-800 tw-ring-inset hover:tw-ring-primary-400/30 tw-flex tw-justify-between tw-items-center tw-font-medium tw-py-3 tw-px-5 tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-300 tw-border-0 ${
                  isExpanded
                    ? "tw-text-primary-300"
                    : "tw-text-iron-300 hover:tw-text-primary-300"
                }`}
                aria-expanded={isExpanded}
              >
                <span className="tw-text-sm">Wave Info</span>
                <svg
                  className={`tw-size-5 tw-transition-all tw-duration-300 ${
                    isExpanded
                      ? "tw-rotate-180 tw-text-primary-300"
                      : "tw-text-iron-400 group-hover:tw-text-primary-300"
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 15.75 7.5-7.5 7.5 7.5"
                  />
                </svg>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="tw-space-y-4 tw-mt-2">
                      <WaveSpecs wave={wave} />
                      <WaveGroups wave={wave} />
                      {showRequiredMetadata && (
                        <WaveRequiredMetadata wave={wave} />
                      )}
                      {showRequiredTypes && <WaveRequiredTypes wave={wave} />}
                      {false && (
                        <>
                          <WaveLeaderboard wave={wave} />
                          <WaveOutcomes wave={wave} />
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="tw-mt-4 tw-mb-3 tw-rounded-xl tw-bg-gradient-to-b tw-p-[1px] tw-from-iron-700 tw-to-iron-800">
                <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-py-5 tw-px-5">
                  <div className="tw-flex tw-items-center tw-gap-x-2">
                    <div className="tw-flex tw-items-center tw-gap-x-3">
                      <div className="tw-h-9 tw-w-9 tw-rounded-xl tw-bg-gradient-to-b tw-p-[1px] tw-from-iron-800 tw-via-indigo-300/40 tw-to-iron-800">
                        <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-flex tw-items-center tw-justify-center">
                          <svg
                            className="tw-flex-shrink-0 tw-inline tw-h-5 tw-w-5 tw-text-indigo-300"
                            width="48"
                            height="48"
                            viewBox="0 0 48 48"
                            fill="none"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <g clipPath="url(#clip0_9330_1241)">
                              <path
                                d="M36 2V22M26 12H46"
                                stroke="currentColor"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M32 44.9997C32 45.4729 31.5221 45.8569 30.9333 45.8569C29.5701 45.8569 28.6827 46.2134 27.6565 46.6266C26.5557 47.0697 25.3088 47.5711 23.4667 47.5711C21.6149 47.5711 20.3627 47.068 19.2576 46.624C18.2336 46.2126 17.3493 45.8569 16 45.8569C14.6507 45.8569 13.7664 46.2126 12.7424 46.624C11.6373 47.068 10.3851 47.5711 8.53333 47.5711C6.6912 47.5711 5.44427 47.0697 4.34347 46.6266C3.31733 46.2134 2.42987 45.8569 1.06667 45.8569C0.477867 45.8569 0 45.4729 0 44.9997C0 44.5266 0.477867 44.1426 1.06667 44.1426C2.9344 44.1426 4.19093 44.6483 5.2992 45.094C6.3168 45.5029 7.19573 45.8569 8.53333 45.8569C9.8816 45.8569 10.7648 45.5011 11.7888 45.0906C12.8939 44.6457 14.1472 44.1426 16 44.1426C17.8528 44.1426 19.1061 44.6457 20.2112 45.0906C21.2352 45.5011 22.1184 45.8569 23.4667 45.8569C24.8043 45.8569 25.6832 45.5029 26.7008 45.094C27.8091 44.6483 29.0656 44.1426 30.9333 44.1426C31.5221 44.1426 32 44.5266 32 44.9997Z"
                                fill="currentColor"
                                stroke="currentColor"
                              />
                              <path
                                d="M32 39.5711C32 40.2019 31.5221 40.7139 30.9333 40.7139C29.5701 40.7139 28.6827 41.1894 27.6565 41.7402C26.5557 42.3311 25.3088 42.9997 23.4667 42.9997C21.6149 42.9997 20.3627 42.3288 19.2576 41.7368C18.2336 41.1882 17.3493 40.7139 16 40.7139C14.6507 40.7139 13.7664 41.1882 12.7424 41.7368C11.6373 42.3288 10.3851 42.9997 8.53333 42.9997C6.6912 42.9997 5.44427 42.3311 4.34347 41.7402C3.31733 41.1894 2.42987 40.7139 1.06667 40.7139C0.477867 40.7139 0 40.2019 0 39.5711C0 38.9402 0.477867 38.4282 1.06667 38.4282C2.9344 38.4282 4.19093 39.1025 5.2992 39.6968C6.3168 40.2419 7.19573 40.7139 8.53333 40.7139C9.8816 40.7139 10.7648 40.2397 11.7888 39.6922C12.8939 39.0991 14.1472 38.4282 16 38.4282C17.8528 38.4282 19.1061 39.0991 20.2112 39.6922C21.2352 40.2397 22.1184 40.7139 23.4667 40.7139C24.8043 40.7139 25.6832 40.2419 26.7008 39.6968C27.8091 39.1025 29.0656 38.4282 30.9333 38.4282C31.5221 38.4282 32 38.9402 32 39.5711Z"
                                fill="currentColor"
                                stroke="currentColor"
                              />
                              <path
                                d="M0 34.2474C0 33.6863 0.477867 33.2309 1.06667 33.2309C4.89387 33.2309 6.336 30.6541 8.16107 27.3912C10.2528 23.6525 12.8555 19 20.2667 19C23.9147 19 26.6667 21.1844 26.6667 24.0825C26.6667 26.4021 24.7253 28.1484 23.4667 28.1484C22.8779 28.1484 22.4 27.6931 22.4 27.132C22.4 26.8433 22.3307 26.4346 21.7301 26.2212C20.9323 25.9386 19.8059 26.1947 19.2736 26.7802C18.0373 28.1413 17.7963 30.3898 18.688 32.248C19.6032 34.1569 21.4912 35.2527 23.8677 35.2527C25.0272 35.2527 25.8421 34.8492 26.7851 34.3816C27.872 33.8428 29.1061 33.2309 30.9333 33.2309C31.5221 33.2309 32 33.6863 32 34.2474C32 34.8085 31.5221 35.2639 30.9333 35.2639C29.6267 35.2639 28.7659 35.6908 27.7685 36.1849C26.7275 36.7012 25.5477 37.2857 23.8667 37.2857C20.6197 37.2857 18.0245 35.7579 16.7467 33.0927C15.5008 30.4945 15.8677 27.4227 17.6597 25.4497C18.7733 24.2248 20.8448 23.7379 22.4747 24.3163C23.1584 24.5592 23.696 24.9689 24.0501 25.4954C24.3104 25.1508 24.5333 24.6741 24.5333 24.0825C24.5333 22.3443 22.6987 21.033 20.2667 21.033C14.1355 21.033 12.1483 24.5856 10.0437 28.3477C8.14187 31.7479 6.17493 35.2639 1.06667 35.2639C0.477867 35.2639 0 34.8085 0 34.2474Z"
                                fill="currentColor"
                                stroke="currentColor"
                              />
                            </g>
                            <defs>
                              <clipPath id="clip0_9330_1241">
                                <rect width="48" height="48" fill="white" />
                              </clipPath>
                            </defs>
                          </svg>
                        </div>
                      </div>

                      <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 tw-tracking-tight">
                        Following
                      </p>
                    </div>
                  </div>
                  <div className="tw-mt-4 tw-flex tw-flex-col tw-space-y-4">
                    <div>
                      <a
                        href="#"
                        className="tw-no-underline tw-flex tw-items-center tw-text-white tw-font-medium tw-text-sm hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
                      >
                        {wave.picture ? (
                          <img
                            src="#"
                            alt="#"
                            className="tw-mr-3 tw-flex-shrink-0 tw-object-contain tw-h-7 tw-w-7 tw-rounded-full tw-bg-iron-900 tw-ring-1 tw-ring-white/10"
                          />
                        ) : (
                          <div className="tw-mr-3 tw-flex-shrink-0 tw-h-7 tw-w-7 tw-rounded-full tw-bg-iron-900" />
                        )}
                        <span>Wave</span>
                      </a>
                    </div>
                  </div>
                  <div className="tw-mt-2 tw-text-right -tw-mb-2">
                    <a
                      href="/waves"
                      className="tw-group -tw-mr-1 tw-no-underline tw-inline-flex tw-bg-transparent tw-border-none tw-text-primary-400 hover:tw-text-primary-300 tw-text-xs tw-font-medium tw-cursor-pointer tw-transition tw-duration-300 tw-ease-out tw-items-center group"
                    >
                      <span className="group-hover:tw-translate-x-[-4px] tw-transition-transform tw-duration-300 tw-ease-out">
                        Show more
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="tw-w-4 tw-h-4 tw-ml-1 tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-duration-300 tw-ease-out"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m8.25 4.5 7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
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
