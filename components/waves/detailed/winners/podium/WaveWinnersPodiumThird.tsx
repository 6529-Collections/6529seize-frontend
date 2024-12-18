import React from "react";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import Link from "next/link";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import { ImageScale } from "../../../../../helpers/image.helpers";
import { getScaledImageUri } from "../../../../../helpers/image.helpers";

interface WaveWinnersPodiumThirdProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveWinnersPodiumThird: React.FC<WaveWinnersPodiumThirdProps> = ({
  drop,
  onDropClick,
}) => {
  return (
    <div className="tw-flex tw-flex-col tw-items-center">
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-3 tw-mb-4">
        <Link
          href={`/${drop.author.handle}`}
          className="tw-flex tw-items-center tw-gap-2 hover:tw-opacity-80 tw-transition-opacity tw-no-underline"
        >
          {drop.author.pfp ? (
            <img
              src={getScaledImageUri(drop.author.pfp, ImageScale.W_AUTO_H_50)}
              alt=""
              className="tw-size-8 tw-rounded-lg tw-ring-1 tw-ring-[#CD7F32]/30 tw-object-cover"
            />
          ) : (
            <div className="tw-size-8 tw-rounded-lg tw-ring-1 tw-ring-[#CD7F32]/30 tw-object-cover tw-bg-iron-900" />
          )}
          <div className="tw-font-semibold tw-text-iron-100 tw-text-sm">
            {drop.author.handle}
          </div>
        </Link>
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
              <span
                className={`${
                  drop.rating >= 0 ? "tw-text-emerald-400" : "tw-text-red"
                } tw-font-medium`}
              >
                {formatNumberWithCommas(drop.rating)}
              </span>
              <span className="tw-text-iron-400">
                {drop.wave.voting_credit_type} total
              </span>
            </div>
            <div className="tw-text-iron-200 tw-text-sm">
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
