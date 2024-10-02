import { ReactNode, useContext, useEffect, useState } from "react";
import Link from "next/link";

import WavesListWrapper, { WavesListType } from "./waves/WavesListWrapper";
import { AuthContext } from "../auth/Auth";
import PrimaryButton from "../utils/button/PrimaryButton";
import MyStreamLayoutTabs from "./my-stream/layout/MyStreamLayoutTabs";

export default function Brain({ children }: { readonly children: ReactNode }) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getShowConnectedIdentityWaves = () =>
    !!connectedProfile?.profile?.handle && !activeProfileProxy;
  const [showConnectedIdentityWaves, setShowConnectedIdentityWaves] = useState(
    getShowConnectedIdentityWaves()
  );

  useEffect(
    () => setShowConnectedIdentityWaves(getShowConnectedIdentityWaves()),
    [connectedProfile, activeProfileProxy]
  );

  return (
    <div>
      <div className="tailwind-scope tw-px-6 tw-relative">
        <div className="tw-flex tw-flex-col lg:tw-flex-row tw-justify-between tw-gap-x-5 tw-gap-y-4">
          <div className="lg:tw-w-[20.5rem] tw-w-full tw-space-y-4">
            <div className="tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-primary-400 tw-to-primary-500">
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
            <div className="tw-relative">
              <svg
                className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-300"
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
                placeholder="Search Wave"
                className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-iron-950 focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base tw-leading-6 tw-transition tw-duration-300 tw-ease-out 
                    tw-pl-11 tw-pr-3 tw-py-3"
              />
            </div>
            {showConnectedIdentityWaves && (
              <>
                <WavesListWrapper type={WavesListType.MY_WAVES} />
                <WavesListWrapper type={WavesListType.FOLLOWING} />
              </>
            )}
            <WavesListWrapper type={WavesListType.POPULAR} />
          </div>
          <div className="tw-flex-1 tw-mr-[20.5rem]">
            <MyStreamLayoutTabs />
            <div className="tw-mt-8 tw-space-y-4">
              <div className="tw-flex tw-items-center tw-gap-4">
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

              <div className="tw-flex tw-gap-x-3 tw-rounded-xl tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-p-4 tw-shadow-lg">
                <div className="tw-relative tw-w-full">
                  <input
                    type="text"
                    placeholder="Create a drop"
                    className="tw-pr-24 tw-resize-none tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-iron-950 focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base tw-leading-6 tw-transition tw-duration-300 tw-ease-out 
                    tw-pl-3 tw-py-2.5"
                  />
                  <div className="tw-flex tw-items-center tw-absolute tw-top-3 tw-right-10">
                    <button
                      type="button"
                      className="tw-border-0 tw-bg-transparent tw-flex tw-items-center tw-ease-out tw-transition tw-duration-300 tw-mr-2 tw-cursor-default tw-text-iron-600 hover:tw-text-iron-600"
                    >
                      <svg
                        className="tw-h-4 tw-w-4 tw-flex-shrink-0 -tw-mr-0.5 tw-opacity-50"
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
                        ></path>
                      </svg>
                      <svg
                        className="tw-h-[1.15rem] tw-w-[1.15rem] tw-flex-shrink-0 tw-opacity-50"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M21 4H3M20 8L6 8M18 12L9 12M15 16L8 16M17 20H12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="tw-flex tw-items-center tw-justify-center tw-p-2 tw-group tw-absolute tw-top-0.5 tw-right-2 tw-rounded-lg tw-border-none tw-bg-transparent tw-ease-out tw-transition tw-duration-300 tw-text-iron-400 hover:tw-text-iron-50 tw-cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="tw-size-6 "
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      ></path>
                    </svg>
                  </button>
                </div>
                <PrimaryButton>Drop</PrimaryButton>
              </div>

              <div>{children}</div>
            </div>
          </div>
        </div>

        <div className="tw-bg-iron-950 tw-fixed tw-inset-y-0 tw-right-0 tw-overflow-y-auto no-scrollbar tw-mt-36 lg:tw-w-[20.5rem] tw-w-full tw-border-l tw-border-iron-700/50 ">
          <div className="tw-flex tw-flex-col tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-800 tw-space-y-2">
            <div>
              <div className="tw-overflow-hidden">
                <div
                  className="tw-h-14 tw-w-full tw-object-cover"
                  style={{
                    background:
                      "linear-gradient(45deg, #1a202c 0%, #2d3748 100%)",
                  }}
                ></div>
              </div>

              <div className="-tw-mt-6 tw-px-5 tw-flex tw-space-x-5">
                <div className="tw-flex">
                  <div className="tw-h-20 tw-w-20 tw-rounded-full tw-object-contain tw-ring-[3px] tw-ring-iron-950 tw-bg-iron-900" />
                </div>

                <div className="tw-mt-10 tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-justify-end tw-space-x-6 tw-pb-1">
                  <div className="tw-min-w-0 tw-flex-1">
                    <div className="tw-flex tw-flex-col tw-items-end tw-gap-y-2">
                      <div className="tw-inline-flex tw-space-x-3 tw-items-center">
                        {/* Placeholder for WaveHeaderFollow */}
                        {/* Placeholder for WaveHeaderOptions */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tw-px-5 tw-pb-5 tw-mt-4 tw-min-w-0 tw-flex-1">
                <div className="tw-group tw-flex tw-items-center tw-space-x-2">
                  <a href="#" className="tw-no-underline">
                    <h1 className="tw-truncate tw-mb-0 tw-text-lg tw-text-iron-200 tw-font-semibold tw-tracking-tight hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out">
                      Memes-Chat
                    </h1>
                  </a>
                </div>
                <div className="tw-flex tw-items-center tw-gap-x-2 tw-mb-2">
                  <div className="tw-text-xs">
                    <span className="tw-font-normal tw-text-iron-400 tw-pr-1">
                      Created
                    </span>
                    <span className="tw-font-normal tw-text-iron-300">
                      2 months ago
                    </span>
                  </div>
                </div>
                <div className="tw-mt-6 tw-flex tw-flex-col tw-gap-y-4">
                  <div className="tw-flex tw-justify-between tw-items-center">
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
                        <span className="tw-font-medium">7</span>{" "}
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
                        ></path>
                      </svg>
                    </button>
                  </div>
                  <div className="tw-flex tw-items-center">
                    <div className="tw-flex -tw-space-x-2">
                      <img
                        src="#"
                        alt="#"
                        className="tw-inline-block tw-h-6 tw-w-6 tw-rounded-md tw-ring-2 tw-ring-black"
                      />
                    </div>
                    <span className="tw-ml-3 tw-text-iron-400 tw-text-sm">
                      <span className="tw-font-medium  tw-text-iron-200">
                        0
                      </span>{" "}
                      Drops
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="tw-px-5 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
                <p className="tw-mb-0 tw-text-lg tw-text-iron-200 tw-font-semibold tw-tracking-tight">
                  General
                </p>
              </div>
              <div className="tw-px-5 tw-py-5 tw-flex tw-flex-col tw-gap-y-6">
                <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
                  <span className="tw-font-medium tw-text-iron-500">Type</span>
                  <div className="tw-inline-flex tw-items-center tw-gap-x-2">
                    <svg
                      className="tw-size-5 tw-text-iron-300"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                      />
                    </svg>
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
                  <a
                    className="tw-no-underline hover:tw-underline tw-text-iron-200 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-gap-x-2"
                    href="#"
                  >
                    <img
                      className="tw-h-6 tw-w-6 tw-rounded-md tw-bg-iron-800"
                      src="#"
                      alt="Profile Picture"
                    />
                    <span className="tw-font-medium tw-text-md">punk6529</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    
  );
}
