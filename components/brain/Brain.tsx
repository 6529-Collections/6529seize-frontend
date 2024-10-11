import { ReactNode, useContext, useEffect, useState } from "react";
import Link from "next/link";
import WavesListWrapper, { WavesListType } from "./waves/WavesListWrapper";
import { AuthContext } from "../auth/Auth";
import PrimaryButton from "../utils/button/PrimaryButton";
import WaveDetailedFollowingWaves from "../waves/detailed/WaveDetailedFollowingWaves";
import CreateDropActions from "../waves/detailed/CreateDropActions";

export default function Brain({ children }: { readonly children: ReactNode }) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getShowConnectedIdentityWaves = () =>
    !!connectedProfile?.profile?.handle && !activeProfileProxy;
  const [showConnectedIdentityWaves, setShowConnectedIdentityWaves] = useState(
    getShowConnectedIdentityWaves()
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(
    () => setShowConnectedIdentityWaves(getShowConnectedIdentityWaves()),
    [connectedProfile, activeProfileProxy]
  );

  return (
    <div className="tw-relative tw-flex tw-h-screen tw-overflow-hidden">
      <div
        className={`tailwind-scope tw-relative tw-flex tw-flex-grow ${
          isCollapsed
            ? "tw-w-full min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto"
            : "tw-px-6"
        }`}
      >
        <div
          className={`tw-flex-grow tw-flex tw-flex-col lg:tw-flex-row tw-justify-between tw-gap-x-5 tw-gap-y-4 ${
            isCollapsed ? "" : "tw-mr-[20.5rem]"
          }`}
        >
          <div className="tw-pt-8 tw-overflow-y-auto lg:tw-w-[20.5rem] tw-w-full no-scrollbar">
            <div>
              <div className="tw-flex tw-justify-center tw-items-center tw-p-1 tw-gap-1 tw-w-full tw-h-11 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-rounded-[10px]">
                <button className="tw-border-0 tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-bg-iron-800 tw-rounded-md">
                  <span className="tw-font-inter tw-font-semibold tw-text-sm tw-text-iron-300">
                    My Stream
                  </span>
                </button>
                <button className="tw-border-0 tw-bg-iron-950 tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-md">
                  <span className="tw-font-inter tw-font-semibold tw-text-sm tw-text-iron-400">
                    Notifications
                  </span>
                  <span className="tw-size-2 -tw-mt-2 -tw-ml-0.5 tw-bg-red tw-rounded-full"></span>
                </button>
              </div>
            </div>
            <div className="tw-mt-4 tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-primary-400 tw-to-primary-500">
              <Link
                href="/waves?new=true"
                className="tw-no-underline tw-text-white hover:tw-bg-primary-600 hover:tw-border-primary-600 hover:tw-text-white tw-w-full tw-flex tw-justify-center tw-gap-x-1.5 tw-items-center tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
              >
                <svg
                  className="tw-size-5 -tw-ml-1 tw-flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Create a Wave</span>
              </Link>
            </div>
            <div className="tw-relative tw-mt-4">
              <div className="tw-relative">
                <svg
                  className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-3 tw-h-5 tw-w-5 tw-text-iron-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <input
                  type="text"
                  className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-2.5 tw-pl-11 tw-pr-3 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset  focus:tw-ring-primary-400 tw-text-base sm:text-sm tw-transition tw-duration-300 tw-ease-out"
                  placeholder="Search a Wave"
                  value=""
                />
              </div>
            </div>
            {showConnectedIdentityWaves && (
              <>
                <WavesListWrapper type={WavesListType.MY_WAVES} />
                {/* <WavesListWrapper type={WavesListType.FOLLOWING} /> */}
              </>
            )}
            <WaveDetailedFollowingWaves />
            <WavesListWrapper type={WavesListType.POPULAR} />
          </div>
          <div className="tw-mt-8 tw-flex-1 tw-flex tw-flex-col tw-h-full tw-overflow-y-auto no-scrollbar tw-scrollbar-thumb-iron-600 tw-scrollbar-track-iron-900">
            <div className="tw-flex tw-items-center tw-gap-4 tw-mb-4">
              <div className="tw-w-14 tw-h-14 tw-rounded-full tw-bg-iron-800 tw-flex tw-items-center tw-justify-center tw-overflow-hidden">
                <img
                  src="/path-to-memes-chat-icon.jpg"
                  alt="#"
                  className="tw-w-full tw-h-full tw-object-cover"
                />
              </div>
              <div className="tw-w-12 tw-h-12 tw-rounded-full tw-bg-transparent tw-border tw-border-dashed tw-border-iron-600 tw-text-iron-600 tw-flex tw-items-center tw-justify-center tw-cursor-pointer hover:tw-border-iron-300 hover:tw-text-iron-300 hover:tw-bg-iron-900 tw-transition-all tw-duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="tw-size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </div>
            </div>
            <div className="tw-sticky tw-top-0 tw-bg-black tw-z-50">
              <div className="tw-flex tw-rounded-xl tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-p-4 tw-shadow-lg">
                <div className="tw-w-full tw-flex tw-items-center tw-gap-x-2 lg:tw-gap-x-3">
                  <CreateDropActions />
                  <input
                    type="text"
                    placeholder="Create a drop"
                    className="tw-max-h-[40vh] editor-input-one-liner tw-resize-none tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-iron-950 focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base tw-leading-6 tw-transition tw-duration-300 tw-ease-out 
                    tw-pl-3 tw-py-2.5 tw-scrollbar-thin tw-scrollbar-thumb-iron-600 tw-scrollbar-track-iron-900"
                  />
                </div>
                <div className="tw-ml-2 lg:tw-ml-3">
                  <PrimaryButton
                    loading={false}
                    disabled={false}
                    onClicked={() => {}}
                    padding="tw-px-2.5 lg:tw-px-3.5 tw-py-2.5"
                  >
                    <span className="tw-hidden lg:tw-inline">Drop</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="tw-size-5 lg:tw-hidden"
                    >
                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                  </PrimaryButton>
                </div>
              </div>
            </div>
            <div className="tw-mt-2 tw-flex-1">
              <div>{children}</div>
            </div>
          </div>
        </div>

        <div
          className={`tw-fixed tw-right-0 tw-top-0 tw-h-full tw-transition-all tw-duration-300 tw-ease-in-out ${
            isCollapsed ? "tw-w-0" : "tw-w-[20.5rem]"
          } tw-bg-iron-950 tw-border-l tw-border-iron-800`}
          id="sidebar"
        >
          <button
            type="button"
            aria-label="Toggle sidebar"
            className={`tw-border-0 tw-absolute tw-top-28 tw-text-iron-500 hover:tw-text-primary-400 tw-transition-all tw-duration-300 tw-ease-in-out tw-bg-iron-800 tw-rounded-lg tw-size-7 tw-flex tw-items-center tw-justify-center tw-shadow-lg hover:tw-shadow-primary-400/20${
              isCollapsed ? " -tw-left-12" : " -tw-left-4"
            } `}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className={`tw-size-4 tw-flex-shrink-0 tw-transition-transform tw-duration-300 tw-ease-in-out ${
                isCollapsed ? "tw-rotate-180" : ""
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </button>

          <div className="tw-p-6 tw-mt-32 tw-text-iron-500 tw-text-sm">
            Wave Header component etc when wave is chosen/active, otherwise this
            part is hidden (with the arrow)
          </div>
        </div>
      </div>
    </div>
  );
}
