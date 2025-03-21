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
import { faImage } from "@fortawesome/free-regular-svg-icons";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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

  const artworkMedia = winner.drop.parts.at(0)?.media.at(0)?.url || null;

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
            <div className="tw-flex tw-flex-col tw-gap-y-4">
              <div className="tw-space-y-2">
                {/* Title section */}
                <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-4">
                  <div className="tw-flex tw-flex-col xl:tw-flex-row tw-items-start xl:tw-items-center tw-gap-y-1 tw-gap-x-2">
                    <div className="tw-flex tw-items-center tw-rounded-md tw-font-medium tw-whitespace-nowrap tw-bg-[rgba(251,191,36,0.1)] tw-px-2 tw-py-1 tw-border tw-border-solid tw-border-[#fbbf24]/20">
                      <FontAwesomeIcon
                        icon={faTrophy}
                        className="tw-flex-shrink-0 tw-size-3 tw-text-[#fbbf24]"
                      />
                    </div>

                    <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0 tw-whitespace-nowrap">
                      {title}
                    </h3>
                  </div>

                  {/* Votes and stats section for desktop (xl+) */}
                  <div className="tw-hidden xl:tw-flex tw-items-center tw-gap-x-4 tw-flex-shrink-0">
                    <div className="tw-flex tw-items-baseline tw-gap-x-1.5">
                      <span
                        className={`tw-text-md tw-font-semibold ${isPositive
                            ? "tw-text-emerald-500"
                            : "tw-text-rose-500"
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
                            content={`${voter.profile.handle
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

                {/* Description - comes after title on mobile */}
                <div className="tw-text-md tw-text-iron-400 tw-line-clamp-3 tw-mt-2 xl:tw-mt-0">
                  {description}
                </div>
                
                {/* Votes and stats section for mobile - visible only on mobile and hidden on xl+ */}
                <div className="tw-flex xl:tw-hidden tw-items-center tw-justify-between tw-mt-3">
                  <div className="tw-flex tw-items-baseline tw-gap-x-1.5">
                    <span
                      className={`tw-text-md tw-font-semibold ${isPositive
                          ? "tw-text-emerald-500"
                          : "tw-text-rose-500"
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
                          content={`${voter.profile.handle
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
              </div>
            </div>
          </div>

          <div className="tw-w-full tw-relative tw-overflow-hidden">
            <div className="tw-aspect-video tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-gradient-to-br tw-from-iron-900/90 tw-to-iron-950 tw-backdrop-blur-sm">
              {artworkMedia ? (
                <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-p-2 tw-overflow-hidden">
                  <img
                    src={artworkMedia}
                    alt={title}
                    className="tw-max-w-full tw-max-h-full tw-object-contain"
                  />
                </div>
              ) : (
                <div className="tw-text-center tw-text-iron-400 tw-px-6">
                  <FontAwesomeIcon
                    icon={faImage}
                    className="tw-w-12 tw-h-12 tw-mx-auto tw-mb-3 tw-text-iron-700 tw-flex-shrink-0"
                  />
                  <p className="tw-text-sm">Artwork preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
