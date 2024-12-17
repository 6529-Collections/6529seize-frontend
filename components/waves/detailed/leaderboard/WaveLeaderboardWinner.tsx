import React from "react";
import { motion } from "framer-motion";
import { DropTrophyIcon } from "../../utils/DropThrophyIcon";
import UserCICAndLevel from "../../../user/utils/UserCICAndLevel";
import { UserCICAndLevelSize } from "../../../user/utils/UserCICAndLevel";
import { cicToType } from "../../../../helpers/Helpers";

interface WaveLeaderboardWinnerProps {
  readonly wave: any;
  readonly onDropClick: (drop: any) => void;
}

export const WaveLeaderboardWinner: React.FC<WaveLeaderboardWinnerProps> = ({
  wave,
  onDropClick,
}) => {
  return (
    <div className="tw-mt-6 tw-space-y-6">
      {/* Title */}
      <div className="tw-text-center">
        <h2 className="tw-text-2xl tw-font-bold tw-text-iron-100">
          Wave Winners
        </h2>
        <p className="tw-mt-2 tw-text-sm tw-text-iron-400">Lorem ipsum dolor sit amet consectetur</p>
      </div>

      {/* Podium Section */}
      <div className="tw-relative tw-mx-auto tw-max-w-3xl">
        <div className="tw-grid tw-grid-cols-3 tw-gap-x-6 tw-items-end">
          {/* Second Place */}
          <div className="tw-flex tw-flex-col tw-items-center">
            <div className="tw-flex tw-flex-col tw-items-center tw-gap-3 tw-mb-4">
              <div className="tw-flex tw-items-center tw-gap-2">
                <img
                  src="https://picsum.photos/200"
                  alt=""
                  className="tw-size-8 tw-rounded-lg tw-ring-1 tw-ring-silver-400/30 tw-object-cover"
                />
                <div className="tw-font-semibold tw-text-iron-100 tw-text-sm">
                  cryptowhale
                </div>
              </div>
            </div>
            <div className="tw-mt-2 tw-relative tw-w-full">
              <div className="tw-absolute tw-z-[1] tw-inset-x-0 -tw-top-3 tw-flex tw-justify-center">
                <div className="tw-shadow-[0_8px_16px_rgba(221,221,221,0.08)] tw-ring-1 tw-bg-gradient-to-b tw-from-[#dddddd]/10 tw-to-iron-900/80 tw-ring-[#dddddd]/20 tw-rounded-xl tw-px-4 tw-py-2 tw-text-[#DDDDDD] tw-font-medium tw-text-sm tw-flex tw-items-center tw-gap-x-2 hover:tw-from-[#dddddd]/15 hover:tw-ring-[#dddddd]/30 tw-transition-all tw-duration-300">
                  2nd
                </div>
              </div>

              <div className="tw-pt-6 tw-h-[140px] tw-bg-gradient-to-b tw-from-iron-900/60 tw-via-iron-950/90 tw-to-transparent tw-backdrop-blur-sm tw-rounded-2xl tw-rounded-b-none tw-ring-1 tw-ring-white/[0.03] tw-ring-b-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-3">
                  <div className="tw-flex tw-items-center tw-gap-1.5 tw-text-base">
                    <span className="tw-text-emerald-400 tw-font-medium">
                      45,678
                    </span>
                    <span className="tw-text-iron-400">TDH total</span>
                  </div>
                  <div className="tw-text-iron-200 tw-text-sm">
                    234 <span className="tw-text-iron-400">voters</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* First Place */}
          <div className="tw-flex tw-flex-col tw-items-center -tw-mx-3 tw-z-10">
            <div className="tw-flex tw-flex-col tw-items-center tw-gap-4 tw-mb-4">
              <div className="tw-flex tw-items-center tw-gap-3">
                <img
                  src="https://picsum.photos/100"
                  alt=""
                  className="tw-size-10 tw-rounded-xl tw-ring-2 tw-ring-[#E8D48A]/30 tw-object-cover tw-shadow-lg"
                />
                <div className="tw-text-xl tw-font-bold tw-bg-gradient-to-r tw-from-[#E8D48A] tw-to-[#D9A962] tw-bg-clip-text tw-text-transparent">
                  nftmaster
                </div>
              </div>
            </div>
            <div className="tw-mt-2 tw-relative tw-w-full">
              <div className="tw-absolute tw-z-[1] tw-inset-x-0 -tw-top-3 tw-flex tw-justify-center">
                <div className="tw-shadow-[0_8px_24px_rgba(232,212,138,0.1)] tw-ring-1 tw-bg-gradient-to-b tw-from-[#E8D48A]/15 tw-to-iron-900/80 tw-ring-[#E8D48A]/20 tw-rounded-xl tw-px-4 tw-py-2 tw-text-[#E8D48A] tw-font-medium tw-text-sm tw-flex tw-items-center tw-gap-x-2 hover:tw-from-[#E8D48A]/20 hover:tw-ring-[#E8D48A]/30 tw-transition-all tw-duration-300">
                  WINNER{" "}
                  <svg
                    className="tw-size-3.5 tw-flex-shrink-0 tw-text-[#E8D48A] tw-drop-shadow-[0_2px_3px_rgba(232,212,138,0.4)]"
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
              </div>

              <div className="tw-pt-6 tw-h-[180px] tw-bg-gradient-to-b tw-from-iron-900/60 tw-via-iron-950/90 tw-to-transparent tw-backdrop-blur-sm tw-rounded-2xl tw-rounded-b-none tw-ring-1 tw-ring-[#E8D48A]/[0.08] tw-ring-b-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-shadow-[0_12px_48px_rgba(0,0,0,0.3)]">
                <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-3">
                  <div className="tw-flex tw-items-center tw-gap-1.5">
                    <span className="tw-text-emerald-400 tw-font-semibold tw-text-xl">
                      89,432
                    </span>
                    <span className="tw-text-iron-400">TDH total</span>
                  </div>
                  <div className="tw-text-iron-200 tw-text-base">
                    567 <span className="tw-text-iron-400">voters</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Third Place */}
          <div className="tw-flex tw-flex-col tw-items-center">
            <div className="tw-flex tw-flex-col tw-items-center tw-gap-3 tw-mb-4">
              <div className="tw-flex tw-items-center tw-gap-2">
                <img
                  src="https://picsum.photos/300"
                  alt=""
                  className="tw-size-8 tw-rounded-lg tw-ring-1 tw-ring-[#CD7F32]/30 tw-object-cover"
                />
                <div className="tw-font-semibold tw-text-iron-100 tw-text-sm">
                  artcollector
                </div>
              </div>
            </div>
            <div className="tw-mt-2 tw-relative tw-w-full">
              <div className="tw-absolute tw-z-[1] tw-inset-x-0 -tw-top-3 tw-flex tw-justify-center">
                <div className="tw-shadow-[0_8px_16px_rgba(205,127,50,0.08)] tw-ring-1 tw-bg-gradient-to-b tw-from-[#CD7F32]/10 tw-to-iron-900/80 tw-ring-[#CD7F32]/20 tw-rounded-xl tw-px-4 tw-py-2 tw-text-[#CD7F32] tw-font-medium tw-text-sm tw-flex tw-items-center tw-gap-x-2 hover:tw-from-[#CD7F32]/15 hover:tw-ring-[#CD7F32]/30 tw-transition-all tw-duration-300">
                  3rd
                </div>
              </div>

              <div className="tw-pt-6 tw-h-[140px] tw-bg-gradient-to-b tw-from-iron-900/60 tw-via-iron-950/90 tw-to-transparent tw-backdrop-blur-sm tw-rounded-2xl tw-rounded-b-none tw-ring-1 tw-ring-white/[0.03] tw-ring-b-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-3">
                  <div className="tw-flex tw-items-center tw-gap-1.5 tw-text-base">
                    <span className="tw-text-emerald-400 tw-font-medium">
                      23,456
                    </span>
                    <span className="tw-text-iron-400">TDH total</span>
                  </div>
                  <div className="tw-text-iron-200 tw-text-sm">
                    123 <span className="tw-text-iron-400">voters</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="tw-space-y-4">
        {/* Winner Post */}
        <div className="tw-rounded-xl tw-bg-gradient-to-b tw-p-[1px] tw-from-[#E8D48A]/20 tw-via-[#D9A962]/20 tw-to-[#E8D48A]/20">
          <div className="tw-bg-iron-950 tw-rounded-xl">
            <div className="tw-p-4">
              {/* Header */}
              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center tw-gap-3.5 tw-no-underline group">
                  <div className="tw-flex tw-items-center tw-gap-4">
                    <div className="tw-shadow-[0_4px_12px_rgba(232,212,138,0.2)] tw-ring-1 tw-bg-gradient-to-b tw-from-[#E8D48A]/30 tw-via-[#E8D48A]/10 tw-to-iron-900 tw-ring-[#E8D48A]/40 tw-rounded-lg tw-py-1 tw-px-1.5 tw-text-[#E8D48A] tw-font-bold tw-text-xs tw-flex tw-items-center tw-gap-x-1 hover:tw-from-[#E8D48A]/40 hover:tw-ring-[#E8D48A]/50 tw-transition-all tw-duration-300 tw-animate-trophy-appear">
                      <svg
                        className="tw-size-4 tw-flex-shrink-0 tw-text-[#E8D48A] tw-drop-shadow-[0_2px_3px_rgba(232,212,138,0.4)]"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 576 512"
                      >
                        <path
                          fill="currentColor"
                          d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                        />
                      </svg>
                      <span className="tw-drop-shadow-[0_2px_3px_rgba(232,212,138,0.4)]">
                        #1
                      </span>
                    </div>
                    <div className="tw-relative">
                      <img
                        className="tw-size-9 md:tw-size-11 tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-object-contain tw-flex-shrink-0"
                        src="https://picsum.photos/100"
                        alt="User avatar"
                      />
                      <div className="tw-absolute -tw-top-1.5 -tw-right-1.5">
                        <UserCICAndLevel
                          level={1}
                          cicType={cicToType(1000)}
                          size={UserCICAndLevelSize.SMALL}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="tw-flex tw-flex-col tw-gap-y-2">
                    <div className="tw-flex tw-items-center tw-gap-2">
                      <span className="tw-text-base tw-font-semibold tw-text-iron-50 tw-leading-none group-hover:tw-text-[#E8D48A]/80 tw-transition-colors">
                        nftmaster
                      </span>
                    </div>
                    <span className="tw-text-xs tw-font-medium tw-text-iron-400 tw-leading-none">
                      2 days ago
                    </span>
                  </div>
                </div>

                <div className="tw-flex tw-items-center tw-gap-4">
                  <div className="tw-flex tw-items-baseline tw-gap-x-1">
                    <span className="tw-font-semibold tw-bg-gradient-to-r tw-from-emerald-400 tw-to-emerald-500 tw-bg-clip-text tw-text-transparent">
                      89,432
                    </span>
                    <span className="tw-text-iron-400 tw-text-sm">TDH total</span>
                  </div>
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <div className="tw-flex -tw-space-x-1.5">
                      <div className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-iron-950 tw-bg-iron-800" />
                      <div className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-iron-950 tw-bg-iron-800" />
                      <div className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-iron-950 tw-bg-iron-800" />
                    </div>
                    <span className="tw-text-sm tw-text-iron-400">
                      567 voters
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="tw-ml-[3.75rem] tw-mt-4 tw-rounded-lg tw-bg-iron-900/50 tw-px-4 tw-pb-4 tw-pt-2 tw-ring-1 tw-ring-iron-800/50">
                <div className="tw-text-iron-300 tw-text-sm tw-leading-relaxed">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Optio
                  doloremque laboriosam iusto.
                </div>
                <div className="tw-mt-4 tw-rounded-lg tw-overflow-hidden tw-bg-iron-900">
                  <img
                    src="https://picsum.photos/800/400"
                    alt="post image"
                    className="tw-w-full tw-h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
