import React from "react";
import Link from "next/link";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import { ImageScale } from "../../../../../helpers/image.helpers";
import { getScaledImageUri } from "../../../../../helpers/image.helpers";

interface WaveWinnersPodiumFirstProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveWinnersPodiumFirst: React.FC<WaveWinnersPodiumFirstProps> = ({
  drop,
  onDropClick,
}) => {
  return (
    <div className="tw-flex tw-flex-col tw-items-center -tw-mx-3 tw-z-10">
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-4 tw-mb-4">
        <Link
          href={`/${drop.author.handle}`}
          className="hover:tw-opacity-80 tw-transition-opacity tw-no-underline"
        >
          <div className="tw-flex tw-items-center tw-gap-3">
            {drop.author.pfp ? (
              <img
                src={getScaledImageUri(drop.author.pfp, ImageScale.W_AUTO_H_50)}
                alt=""
                className="tw-size-10 tw-rounded-xl tw-ring-2 tw-ring-[#E8D48A]/30 tw-object-cover tw-shadow-lg"
              />
            ) : (
              <div className="tw-size-10 tw-rounded-xl tw-ring-2 tw-ring-[#E8D48A]/30 tw-shadow-lg tw-bg-iron-900" />
            )}
            <div className="tw-text-xl tw-font-bold tw-bg-gradient-to-r tw-from-[#E8D48A] tw-to-[#D9A962] tw-bg-clip-text tw-text-transparent">
              {drop.author.handle}
            </div>
          </div>
        </Link>
      </div>
      <div className="tw-mt-2 tw-relative tw-w-full">
        <div className="tw-absolute tw-z-[1] tw-inset-x-0 -tw-top-3 tw-flex tw-justify-center">
          <div className="tw-shadow-[0_8px_24px_rgba(232,212,138,0.1)] tw-ring-1 tw-bg-gradient-to-b tw-from-[#E8D48A]/15 tw-to-iron-900/80 tw-ring-[#E8D48A]/20 tw-rounded-xl tw-px-3 tw-py-1.5 tw-text-[#E8D48A] tw-font-medium tw-text-sm tw-flex tw-items-center tw-gap-x-2 hover:tw-from-[#E8D48A]/20 hover:tw-ring-[#E8D48A]/30 tw-transition-all tw-duration-300">
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
            <span className="tw-drop-shadow-[0_2px_3px_rgba(232,212,138,0.4)]">
              1st
            </span>
          </div>
        </div>

        <div className="tw-pt-6 tw-h-[180px] tw-bg-gradient-to-b tw-from-iron-900/60 tw-via-iron-950/90 tw-to-transparent tw-backdrop-blur-sm tw-rounded-2xl tw-rounded-b-none tw-ring-1 tw-ring-[#E8D48A]/[0.08] tw-ring-b-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-shadow-[0_12px_48px_rgba(0,0,0,0.3)]">
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-3">
            <div className="tw-flex tw-items-center tw-gap-1.5">
              <span
                className={`${
                  drop.rating >= 0 ? "tw-text-emerald-400" : "tw-text-red"
                } tw-font-semibold tw-text-xl`}
              >
                {formatNumberWithCommas(drop.rating)}
              </span>
              <span className="tw-text-iron-400">
                {drop.wave.voting_credit_type} total
              </span>
            </div>
            <div className="tw-text-iron-200 tw-text-base">
              {formatNumberWithCommas(drop.raters_count)}{" "}
              <span className="tw-text-iron-400">
                {drop.raters_count === 1 ? "voter" : "voters"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
