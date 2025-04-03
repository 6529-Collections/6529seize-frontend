import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ApiWaveDecisionWinner } from "../../../../generated/models/ApiWaveDecisionWinner";
import WaveWinnersDropHeaderAuthorPfp from "./header/WaveWinnersDropHeaderAuthorPfp";
import Link from "next/link";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../../user/utils/UserCICAndLevel";
import {
  cicToType,
  formatNumberWithCommas,
  getTimeAgoShort,
} from "../../../../helpers/Helpers";
import Tippy from "@tippyjs/react";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MemeDropTraits from "../../../memes/drops/MemeDropTraits";
import DropListItemContentMedia from "../../../drops/view/item/content/media/DropListItemContentMedia";


interface MemesWaveWinnersDropProps {
  readonly winner: ApiWaveDecisionWinner;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const MemesWaveWinnersDrop: React.FC<MemesWaveWinnersDropProps> = ({
  winner,
  wave,
  onDropClick,
}) => {

  const title =
    winner.drop.metadata?.find((m) => m.data_key === "title")?.data_value ||
    "Artwork Title";
  const description =
    winner.drop.metadata?.find((m) => m.data_key === "description")
      ?.data_value || "This is an artwork submission for The Memes collection.";

  const artworkMedia = winner.drop.parts.at(0)?.media.at(0);

  const rating = winner.drop.rating || 0;
  const isPositive = rating >= 0;
  const ratersCount = winner.drop.raters_count || 0;
  const topVoters = winner.drop.top_raters?.slice(0, 3) || [];
  const creditType = wave.voting?.credit_type || "votes";

  return (
    <div
      onClick={() =>
        onDropClick({
          ...winner.drop,
          stableKey: winner.drop.id,
          stableHash: winner.drop.id,
        })
      }
      className="tw-cursor-pointer tw-rounded-xl tw-transition-all tw-duration-300 tw-ease-out tw-w-full"
    >
      <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 desktop-hover:hover:tw-border-[#fbbf24]/40 tw-shadow-[0_0_15px_rgba(251,191,36,0.15)] tw-transition-all tw-duration-200 tw-ease-out tw-overflow-hidden tw-bg-iron-950">
        <div className="tw-flex tw-flex-col">
          <div className="tw-p-4">
            <div className="tw-flex tw-flex-col tw-gap-y-1.5">
              <div className="tw-flex tw-items-center tw-gap-x-3">
                <Link
                  href={`/${winner.drop.author?.handle}`}
                  onClick={(e) => e.stopPropagation()}
                  className="tw-flex tw-items-center tw-gap-x-2 tw-no-underline group"
                >
                  <WaveWinnersDropHeaderAuthorPfp winner={winner} />
                </Link>
                <div className="tw-flex tw-items-center tw-gap-x-4">
                  <div className="tw-flex tw-items-center tw-gap-x-2">
                    {winner.drop.author?.level && (
                      <UserCICAndLevel
                        level={winner.drop.author.level}
                        cicType={cicToType(winner.drop.author.cic || 0)}
                        size={UserCICAndLevelSize.SMALL}
                      />
                    )}
                    <Link
                      href={`/${winner.drop.author?.handle}`}
                      onClick={(e) => e.stopPropagation()}
                      className="tw-no-underline hover:tw-opacity-80 tw-transition-opacity"
                    >
                      <span className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold tw-text-iron-100">
                        {winner.drop.author?.handle}
                      </span>
                    </Link>

                    <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>

                    <span className="tw-text-md tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
                      {getTimeAgoShort(winner.drop.created_at)}
                    </span>
                  </div>
                </div>
                <div className="tw-flex tw-items-center tw-rounded-md tw-font-medium tw-whitespace-nowrap tw-bg-[rgba(251,191,36,0.1)] tw-px-2 tw-py-1 tw-border tw-border-solid tw-border-[#fbbf24]/20">
                  <FontAwesomeIcon
                    icon={faTrophy}
                    className="tw-flex-shrink-0 tw-size-3 tw-text-[#fbbf24]"
                  />
                </div>
              </div>
              <div className="tw-mt-1 sm:tw-mt-0 sm:tw-ml-[3.25rem]">
                <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0 tw-whitespace-nowrap">
                  {title}
                </h3>
                <div className="tw-text-md tw-text-iron-400">{description}</div>
              </div>
            </div>
          </div>

          {artworkMedia && (
            <div className="tw-flex tw-justify-center tw-bg-iron-900/40 tw-h-96">
              <DropListItemContentMedia
                media_mime_type={artworkMedia.mime_type}
                media_url={artworkMedia.url}
              />
            </div>
          )}
          <div className="tw-p-4">
            <MemeDropTraits drop={winner.drop} />
          </div>
          <div className="tw-flex tw-items-center tw-gap-x-4 tw-flex-shrink-0 tw-px-4 tw-pb-4">
            <div className="tw-flex tw-items-baseline tw-gap-x-1.5">
              <span
                className={`tw-text-md tw-font-semibold ${
                  isPositive ? "tw-text-emerald-500" : "tw-text-rose-500"
                } `}
              >
                {formatNumberWithCommas(rating)}
              </span>
              <span className="tw-text-sm tw-text-iron-400 tw-tracking-wide">
                {creditType}
              </span>
            </div>

            <div className="tw-flex tw-items-center tw-gap-x-2">
              <div className="tw-flex tw-items-center -tw-space-x-1.5">
                {topVoters.map((voter) => (
                  <Tippy
                    key={voter.profile.handle}
                    content={`${
                      voter.profile.handle
                    } - ${formatNumberWithCommas(voter.rating)}`}
                  >
                    <Link
                      href={`/${voter.profile.handle}`}
                      onClick={(e) => e.stopPropagation()}
                      className="tw-transition-transform hover:tw-translate-y-[-2px]"
                    >
                      {voter.profile.pfp ? (
                        <img
                          className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-iron-950 tw-border tw-border-iron-800/60"
                          src={voter.profile.pfp}
                          alt="Recent voter"
                        />
                      ) : (
                        <div className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-iron-950 tw-bg-iron-800" />
                      )}
                    </Link>
                  </Tippy>
                ))}
              </div>
              <div className="tw-flex tw-items-baseline tw-gap-x-1">
                <span className="tw-text-md tw-font-medium tw-text-iron-100">
                  {formatNumberWithCommas(ratersCount)}
                </span>
                <span className="tw-text-sm tw-text-iron-400">
                  {ratersCount === 1 ? "voter" : "voters"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
