import React from "react";
import { ApiWave } from "../../../../generated/models/ObjectSerializer";

interface WaveDropProps {
  readonly wave: ApiWave;
}

export const WaveDrop: React.FC<WaveDropProps> = ({ wave }) => {
  return (
    <div className="tw-max-w-lg">
      <div className="tw-group">
        <div className="tw-rounded-xl tw-bg-gradient-to-b tw-from-iron-900 tw-to-iron-900 tw-p-[1px] tw-transition tw-duration-300 tw-ease-out">
          <div className="tw-rounded-xl tw-bg-iron-950/95 tw-backdrop-blur-xl tw-p-6">
            <div className="tw-flex tw-gap-6">
              {/* Position Indicator */}
              <div className="tw-flex tw-flex-col tw-items-center tw-gap-2">
                <div className="tw-text-iron-300 tw-font-semibold">#4</div>
                <div className="tw-text-iron-400 tw-text-sm">/100</div>
              </div>

              {/* Content */}
              <div className="tw-flex-1">
                <div className="tw-relative tw-mb-3">
                  <img
                    src="https://picsum.photos/800/400"
                    alt="Submission preview"
                    className="tw-w-full tw-object-contain"
                  />
                </div>
                <div className="tw-relative tw-mb-5">
                  <p className="tw-text-md tw-mb-0 tw-font-normal tw-leading-relaxed tw-text-iron-300">
                    Building scalable solutions for next-generation web
                    applications with focus on performance and security.
                    Implementing advanced caching strategies and optimization
                    techniques.
                  </p>
                </div>
                {/* Wave Stats Section */}
                <div className="tw-flex tw-flex-col tw-gap-5">
                  {/* Time and Vote Actions */}
                  <div className="tw-flex tw-items-center tw-justify-between">
                    <div className="tw-flex tw-items-center tw-gap-1.5 tw-px-3.5 tw-py-1.5 tw-rounded-full tw-bg-iron-900">
                      <svg
                        className="tw-size-4 tw-text-iron-300"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 6v6l4 2M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="tw-text-sm tw-font-medium tw-text-iron-300">
                        1d 4h 45m
                      </span>
                    </div>

                    <div className="tw-flex tw-items-center tw-gap-3">
                      <button className="tw-group tw-flex tw-items-center tw-justify-center tw-size-10 tw-border-0 tw-rounded-xl tw-bg-emerald-500/10 hover:tw-bg-emerald-500/15 tw-ring-1 tw-ring-emerald-500/30 hover:tw-ring-emerald-500/50 tw-transition-all tw-duration-300">
                        <svg
                          className="tw-w-5 tw-h-5 tw-text-emerald-400 group-hover:tw-text-emerald-300 tw-transition-colors"
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

                      <button className="tw-group tw-flex tw-items-center tw-justify-center tw-size-10 tw-border-0 tw-rounded-xl tw-bg-red/10 hover:tw-bg-red/20 tw-ring-1 tw-ring-red/30 hover:tw-ring-red/50 tw-transition-all tw-duration-300">
                        <svg
                          className="tw-w-5 tw-h-5 tw-text-red group-hover:tw-text-red tw-transition-colors"
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
                  {/* Amount and Votes */}
                  <div className="tw-flex tw-items-center tw-justify-between tw-p-4 tw-rounded-xl tw-bg-iron-900/40 tw-backdrop-blur-sm">
                    <div className="tw-flex tw-flex-col">
                      <span className="tw-text-xl tw-font-semibold tw-text-iron-100">
                        430,400 TDH
                      </span>
                      <span className="tw-text-sm tw-text-iron-400">
                        Total Amount
                      </span>
                    </div>

                    <div className="tw-flex tw-flex-col tw-items-end">
                      <div className="tw-flex tw-items-center tw-gap-3">
                        <div className="tw-flex -tw-space-x-2">
                          <img
                            className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-iron-950 tw-transition hover:tw-translate-y-[-2px]"
                            src="https://avatars.githubusercontent.com/u/1?v=4"
                            alt="Recent voter"
                          />
                          <img
                            className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-iron-950 tw-transition hover:tw-translate-y-[-2px]"
                            src="https://avatars.githubusercontent.com/u/2?v=4"
                            alt="Recent voter"
                          />
                          <img
                            className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-iron-950 tw-transition hover:tw-translate-y-[-2px]"
                            src="https://avatars.githubusercontent.com/u/3?v=4"
                            alt="Recent voter"
                          />
                        </div>
                        <span className="tw-text-lg tw-font-semibold tw-text-iron-200">
                          434
                        </span>
                      </div>
                      <span className="tw-text-sm tw-text-iron-400">
                        Total Votes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Section */}
                <div className="tw-flex tw-flex-col tw-gap-4 tw-pt-4">
                  {/* User Info Row */}
                  <div className="tw-flex tw-items-center tw-justify-between">
                    <div className="tw-flex tw-items-center tw-gap-x-3">
                      <div className="tw-relative">
                        <img
                          className="tw-size-8 tw-rounded-lg tw-ring-2 tw-ring-[#E8D48A]/20 tw-object-cover"
                          src="https://avatars.githubusercontent.com/u/10000000?v=4"
                          alt="User avatar"
                        />
                      </div>
                      <div className="tw-flex tw-flex-col">
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
                        <div className="tw-flex tw-items-center tw-gap-4 tw-mt-1">
                          <div className="tw-flex tw-items-center tw-gap-x-1.5">
                            <svg
                              className="tw-w-3.5 tw-h-3.5 tw-text-blue-400 tw-flex-shrink-0"
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
                            <span className="tw-text-blue-400 tw-font-medium tw-text-xs">
                              150 NIC
                            </span>
                          </div>
                          <div className="tw-flex tw-items-center tw-gap-x-1.5">
                            <svg
                              className="tw-w-3.5 tw-h-3.5 tw-text-emerald-400 tw-flex-shrink-0"
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
                            <span className="tw-text-emerald-400 tw-font-medium tw-text-xs">
                              15K Rep
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
        </div>
      </div>
    </div>
  );
};
