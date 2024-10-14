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
    <div className="tw-relative tw-h-screen tw-overflow-hidden tw-flex tw-flex-col">
      <div
        className={`tailwind-scope tw-relative tw-flex tw-flex-grow ${
          isCollapsed
            ? "tw-w-full min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto"
            : "tw-px-6"
        }`}
      >
        <div
          className={`tw-h-screen tw-flex-grow tw-flex tw-flex-col lg:tw-flex-row tw-justify-between tw-gap-x-5 tw-gap-y-4 ${
            isCollapsed ? "" : "tw-mr-[20.5rem]"
          }`}
        >
          <div className="tw-pt-8 tw-overflow-y-auto lg:tw-w-[20.5rem] tw-w-full no-scrollbar">
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
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
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
            <div className="tw-flex-grow tw-overflow-y-auto no-scrollbar">
              {showConnectedIdentityWaves && (
                <>
                  <WavesListWrapper type={WavesListType.MY_WAVES} />
                  {/* <WavesListWrapper type={WavesListType.FOLLOWING} /> */}
                </>
              )}
              <WaveDetailedFollowingWaves />
              <WavesListWrapper type={WavesListType.POPULAR} />
            </div>
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
                  aria-hidden="true"
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
                      aria-hidden="true"
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
          className={`tw-fixed tw-right-0 tw-top-0 tw-h-screen tw-transition-all tw-duration-300 tw-ease-in-out ${
            isCollapsed ? "tw-w-0" : "tw-w-[20.5rem]"
          } tw-bg-iron-950 tw-border-l tw-border-iron-800 tw-flex tw-flex-col`}
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
              aria-hidden="true"
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

          <div className="tw-pt-32 tw-text-iron-500 tw-text-sm tw-overflow-y-auto horizontal-menu-hide-scrollbar tw-h-full">
            <div className="tw-h-full tw-divide-y tw-divide-solid tw-divide-iron-800 tw-divide-x-0">
              <div className="tw-px-5">
                <div className="tw-h-20 tw-w-20 tw-rounded-full tw-ring-[3px] tw-ring-iron-950 tw-bg-iron-900"></div>
                <div className="tw-pb-5 tw-mt-2 tw-min-w-0 tw-flex-1">
                  <div className="tw-group tw-flex tw-items-center tw-space-x-2">
                    <a href="" className="tw-no-underline">
                      <h1 className="tw-mb-0 tw-text-lg sm:tw-text-xl tw-text-iron-200 tw-font-semibold tw-tracking-tight hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out">
                        Memes-Chat
                      </h1>
                    </a>
                  </div>
                  <div className="tw-flex tw-items-center tw-gap-x-2 tw-mb-2 tw-mt-1">
                    <div className="tw-text-xs">
                      <span className="tw-font-normal tw-text-iron-400 tw-pr-1">
                        Created
                      </span>
                      <span className="tw-font-normal tw-text-iron-400">
                        1 day ago
                      </span>
                    </div>
                  </div>
                  <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-y-4">
                    <div className="tw-flex tw-justify-between">
                      <button className="tw-p-0 tw-bg-transparent tw-border-none tw-text-sm tw-flex tw-items-center tw-gap-x-2 tw-text-iron-200 hover:tw-underline tw-transition tw-duration-300 tw-ease-out">
                        <svg
                          className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
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
                            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                          ></path>
                        </svg>
                        <span>
                          <span className="tw-font-medium">122</span>{" "}
                          <span className="tw-text-iron-400">Followers</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="tw-h-8 tw-w-8 tw-text-iron-400 hover:tw-text-iron-300 tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-iron-800 tw-ring-1 tw-ring-iron-700 hover:tw-ring-iron-650 tw-rounded-lg tw-bg-iron-800 tw-text-sm tw-font-semibold tw-shadow-sm hover:tw-bg-iron-700 hover:tw-border-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
                      >
                        <svg
                          className="tw-size-4 tw-flex-shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12.0004 15L12.0004 22M8.00043 7.30813V9.43875C8.00043 9.64677 8.00043 9.75078 7.98001 9.85026C7.9619 9.93852 7.93194 10.0239 7.89095 10.1042C7.84474 10.1946 7.77977 10.2758 7.64982 10.4383L6.08004 12.4005C5.4143 13.2327 5.08143 13.6487 5.08106 13.9989C5.08073 14.3035 5.21919 14.5916 5.4572 14.7815C5.73088 15 6.26373 15 7.32943 15H16.6714C17.7371 15 18.27 15 18.5437 14.7815C18.7817 14.5916 18.9201 14.3035 18.9198 13.9989C18.9194 13.6487 18.5866 13.2327 17.9208 12.4005L16.351 10.4383C16.2211 10.2758 16.1561 10.1946 16.1099 10.1042C16.0689 10.0239 16.039 9.93852 16.0208 9.85026C16.0004 9.75078 16.0004 9.64677 16.0004 9.43875V7.30813C16.0004 7.19301 16.0004 7.13544 16.0069 7.07868C16.0127 7.02825 16.0223 6.97833 16.0357 6.92937C16.0507 6.87424 16.0721 6.8208 16.1149 6.71391L17.1227 4.19423C17.4168 3.45914 17.5638 3.09159 17.5025 2.79655C17.4489 2.53853 17.2956 2.31211 17.0759 2.1665C16.8247 2 16.4289 2 15.6372 2H8.36368C7.57197 2 7.17611 2 6.92494 2.1665C6.70529 2.31211 6.55199 2.53853 6.49838 2.79655C6.43707 3.09159 6.58408 3.45914 6.87812 4.19423L7.88599 6.71391C7.92875 6.8208 7.95013 6.87424 7.96517 6.92937C7.97853 6.97833 7.98814 7.02825 7.99392 7.07868C8.00043 7.13544 8.00043 7.19301 8.00043 7.30813Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="tw-flex tw-items-center">
                      <div className="tw-flex -tw-space-x-2">
                        <img
                          className="tw-inline-block tw-h-6 tw-w-6 tw-rounded-md tw-ring-2 tw-ring-black tw-bg-iron-900"
                          alt="#"
                        />
                      </div>
                      <span className="tw-font-normal tw-ml-2 tw-text-iron-400 tw-text-sm">
                        <span className="tw-text-iron-200">123</span> Drops
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tw-px-5 tw-pt-4">
                <div className="tw-w-full">
                  <div className="tw-flex tw-justify-between tw-items-start tw-gap-x-6">
                    <p className="tw-mb-0 tw-text-lg tw-text-iron-200 tw-font-semibold tw-tracking-tight">
                      General
                    </p>
                  </div>
                  <div className="tw-py-5 tw-flex tw-flex-col tw-gap-y-6">
                    <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
                      <span className="tw-font-medium tw-text-iron-500">
                        Type
                      </span>
                      <div className="tw-flex tw-flex-col tw-gap-y-1.5">
                        <span className="tw-font-medium tw-text-iron-200 tw-text-md">
                          Chat
                        </span>
                      </div>
                    </div>
                    <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
                      <span className="tw-font-medium tw-text-iron-500">
                        Rating
                      </span>
                      <div className="tw-flex tw-flex-col tw-gap-y-1.5">
                        <span className="tw-font-medium tw-text-iron-200 tw-text-md">
                          By TDH
                        </span>
                      </div>
                    </div>
                    <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
                      <span className="tw-font-medium tw-text-iron-500">
                        Created by
                      </span>
                      <div className="tw-flex tw-flex-col tw-gap-y-1.5">
                        <span className="tw-font-medium tw-text-iron-200 tw-text-md">
                          punk6529
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tw-px-5 tw-pt-4">
                <div className="tw-w-full">
                  <div className="tw-flex tw-justify-between tw-items-start tw-gap-x-6">
                    <p className="tw-mb-0 tw-text-lg tw-text-iron-200 tw-font-semibold tw-tracking-tight">
                      Groups
                    </p>
                  </div>
                  <div className="tw-py-5 tw-flex tw-flex-col tw-gap-y-6">
                    <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
                      <span className="tw-font-medium tw-text-iron-500">
                        View
                      </span>
                      <div className="tw-flex tw-flex-col tw-gap-y-1.5">
                        <span className="tw-font-medium tw-text-iron-200 tw-text-md">
                          Anyone
                        </span>
                      </div>
                    </div>
                    <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
                      <span className="tw-font-medium tw-text-iron-500">
                        Drop
                      </span>
                      <div className="tw-flex tw-flex-col tw-gap-y-1.5">
                        <span className="tw-font-medium tw-text-iron-200 tw-text-md">
                          Anyone
                        </span>
                      </div>
                    </div>
                    <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
                      <span className="tw-font-medium tw-text-iron-500">
                        Vote
                      </span>
                      <div className="tw-flex tw-flex-col tw-gap-y-1.5">
                        <span className="tw-font-medium tw-text-iron-200 tw-text-md">
                          Anyone
                        </span>
                      </div>
                    </div>
                    <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
                      <span className="tw-font-medium tw-text-iron-500">
                        Admin
                      </span>
                      <div className="tw-flex tw-flex-col tw-gap-y-1.5">
                        <span className="tw-font-medium tw-text-iron-200 tw-text-md">
                          Only punk6529
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tw-px-5 tw-pt-4">
                <p className="tw-mb-0 tw-text-lg tw-text-white tw-font-semibold tw-tracking-tight">
                  Required Metadata
                </p>
                <div className="tw-pt-5 tw-pb-4 tw-flex tw-flex-col">items</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
