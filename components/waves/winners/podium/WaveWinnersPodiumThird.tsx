import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import Link from "next/link";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import {
  ImageScale,
  getScaledImageUri,
} from "../../../../helpers/image.helpers";
import { WavePodiumItemContentOutcomes } from "./WavePodiumItemContentOutcomes";
import { ApiWave } from "../../../../generated/models/ApiWave";

interface WaveWinnersPodiumThirdProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveWinnersPodiumThird: React.FC<WaveWinnersPodiumThirdProps> = ({
  drop,
  wave,
  onDropClick,
}) => {
  return (
    <div onClick={() => onDropClick(drop)} className="tw-cursor-pointer tw-group">
      <div className="tw-flex tw-flex-col tw-items-center">
        <div className="tw-flex tw-flex-col tw-items-center -tw-mb-2 tw-relative tw-z-10">
          <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-b tw-from-[#CD7F32]/20 tw-to-transparent tw-blur-2xl tw-scale-150" />

          <Link
            href={`/${drop.author.handle}`}
            onClick={(e) => e.stopPropagation()}
            className="tw-transform hover:tw-scale-105 tw-transition-all tw-duration-300"
          >
            {drop.author.pfp ? (
              <img
                src={getScaledImageUri(drop.author.pfp, ImageScale.W_AUTO_H_50)}
                alt=""
                className="tw-size-9 md:tw-size-11 tw-rounded-xl tw-ring-2 tw-ring-[#CD7F32] tw-object-cover tw-shadow-[0_0_20px_rgba(205,127,50,0.3)]"
              />
            ) : (
              <div className="tw-size-9 md:tw-size-11 tw-rounded-xl tw-ring-2 tw-ring-[#CD7F32] tw-shadow-[0_0_20px_rgba(205,127,50,0.3)] tw-bg-iron-900" />
            )}
          </Link>

          <div className="tw-absolute -tw-bottom-4 tw-inset-x-0 tw-flex tw-justify-center">
            <div className="tw-bg-iron-900/80 tw-backdrop-blur-sm tw-shadow-lg tw-px-2.5 tw-py-0.5 tw-rounded-full tw-flex tw-items-center tw-gap-1.5 tw-border tw-border-iron-700">
              <svg
                className="tw-size-3 md:tw-size-4 tw-text-[#CD7F32]"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 576 512"
              >
                <path
                  fill="currentColor"
                  d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                />
              </svg>
              <span className="tw-text-[#CD7F32] tw-font-medium tw-text-xs sm:tw-text-sm">
                3rd
              </span>
            </div>
          </div>
        </div>

        <div className="tw-relative tw-w-full">
          <div className="tw-h-[170px] tw-transition-all tw-duration-300 tw-ease-out tw-bg-gradient-to-b tw-from-iron-900/70 tw-via-iron-900/50 tw-to-transparent tw-backdrop-blur-xl tw-rounded-xl tw-border tw-border-iron-800/60 tw-flex tw-flex-col tw-items-center tw-justify-center tw-shadow-[0_4px_24px_rgba(0,0,0,0.2)] tw-relative tw-overflow-hidden group-hover:desktop-hover:tw-from-iron-900/75 group-hover:desktop-hover:tw-via-iron-900/55 group-hover:desktop-hover:tw-to-transparent group-hover:desktop-hover:tw-border-iron-700/70 group-hover:desktop-hover:tw-shadow-[0_0_48px_rgba(0,0,0,0.35)]">
            <div className="tw-absolute tw-inset-0">
              <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-b tw-from-[#CD7F32]/5 tw-via-[#CD7F32]/3 tw-to-transparent group-hover:desktop-hover:tw-from-[#CD7F32]/[0.07]" />
              <div className="tw-absolute tw-inset-x-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-[#CD7F32]/10 tw-to-transparent group-hover:desktop-hover:tw-via-[#CD7F32]/25" />
              <div className="tw-absolute tw-inset-y-0 tw-right-0 tw-w-px tw-bg-gradient-to-b tw-from-[#CD7F32]/10 tw-via-[#CD7F32]/5 tw-to-transparent group-hover:desktop-hover:tw-via-[#CD7F32]/25" />
              <div className="tw-absolute tw-inset-y-0 tw-left-0 tw-w-px tw-bg-gradient-to-b tw-from-[#CD7F32]/10 tw-via-[#CD7F32]/5 tw-to-transparent group-hover:desktop-hover:tw-via-[#CD7F32]/25" />
              <div className="tw-absolute tw-bottom-0 tw-h-3/4 tw-inset-x-0 tw-bg-gradient-to-t tw-from-black/20 tw-via-black/10 tw-to-transparent" />
            </div>

            <Link
              href={`/${drop.author.handle}`}
              onClick={(e) => e.stopPropagation()}
              className="tw-transition-all tw-no-underline tw-mb-2 tw-mt-2 sm:tw-mt-4 tw-relative tw-text-center desktop-hover:hover:tw-text-[#CD7F32] tw-group/link"
            >
              <span className="tw-text-sm sm:tw-text-base tw-font-semibold tw-text-iron-200 desktop-hover:hover:tw-text-[#CD7F32] tw-transition-colors tw-inline-flex tw-items-center">
                {drop.author.handle}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="tw-size-3 tw-opacity-0 tw-transition-opacity tw-text-[#CD7F32] tw-ml-2 desktop-hover:group-hover/link:tw-opacity-100 tw-absolute tw-left-[100%]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
                  />
                </svg>
              </span>
            </Link>

            <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-2 tw-relative">
              <div className="tw-flex tw-items-center tw-gap-x-1">
                <span
                  className={`${
                    drop.rating >= 0 ? "tw-text-[#CD7F32]" : "tw-text-[#ff4466]"
                  } tw-font-semibold tw-text-base`}
                >
                  {formatNumberWithCommas(drop.rating)}
                </span>
                <span className="tw-text-iron-400 tw-text-xs sm:tw-text-sm">
                  {drop.wave.voting_credit_type}
                </span>
              </div>

              <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-2">
                <div className="tw-flex tw-items-center tw-gap-x-1">
                  <span className="tw-text-iron-200 tw-text-xs sm:tw-text-sm">
                    {formatNumberWithCommas(drop.raters_count)}
                  </span>
                  <span className="tw-text-iron-400 tw-text-xs sm:tw-text-sm">
                    {drop.raters_count === 1 ? "voter" : "voters"}
                  </span>
                </div>

                <WavePodiumItemContentOutcomes drop={drop} wave={wave} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
