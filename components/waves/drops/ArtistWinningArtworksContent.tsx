import React from "react";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { useUserWinningArtworks } from "@/hooks/useUserWinningArtworks";
import type {
  ExtendedDrop} from "@/helpers/waves/drop.helpers";
import {
  convertApiDropToExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy, faEye } from "@fortawesome/free-solid-svg-icons";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { Time } from "@/helpers/time";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import Link from "next/link";
import { Tooltip } from "react-tooltip";

interface ArtistWinningArtworksContentProps {
  readonly user: ApiProfileMin;
  readonly isOpen: boolean;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const ArtistWinningArtworksContent: React.FC<
  ArtistWinningArtworksContentProps
> = ({ user, isOpen, onDropClick }) => {
  const { winningDrops, isLoading } = useUserWinningArtworks({
    user,
    enabled: isOpen,
  });

  if (isLoading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-96">
        <div className="tw-flex tw-flex-col tw-items-center tw-gap-4">
          <div className="tw-animate-spin tw-rounded-full tw-h-8 tw-w-8 tw-border-b tw-border-solid tw-border-t-0 tw-border-x-0 tw-border-amber-400"></div>
          <span className="tw-text-iron-400 tw-text-sm tw-animate-fade-in-out">
            Loading won artworks...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="tw-relative tw-z-[100] tw-p-6 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-max-h-[calc(75vh-120px)] sm:tw-max-h-[calc(90vh-140px)]"
    >
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6">
        {winningDrops.map((drop) => {
          const extendedDrop = convertApiDropToExtendedDrop(drop);
          const decisionTime = drop.winning_context?.decision_time;

          return (
            <div key={drop.id} className="tw-flex tw-flex-col tw-h-full">
              <div
                className="tw-group tw-relative tw-cursor-pointer tw-flex tw-flex-col tw-flex-1 tw-bg-iron-950/50 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg tw-overflow-hidden desktop-hover:hover:tw-border-iron-700 tw-shadow-lg desktop-hover:hover:tw-shadow-xl tw-transition-all tw-duration-300 tw-ease-out"
                onClick={() => onDropClick(extendedDrop)}
              >
                <div className="tw-aspect-square tw-relative tw-overflow-hidden tw-bg-iron-950/50">
                  <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center">
                    {drop.parts?.[0]?.media &&
                    drop.parts[0].media.length > 0 ? (
                      <MediaDisplay
                        media_url={drop.parts[0]!.media[0]!.url}
                        media_mime_type={drop.parts[0]!.media[0]!.mime_type}
                        disableMediaInteraction={true}
                      />
                    ) : (
                      <div className="tw-w-full tw-h-full tw-bg-iron-950 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-p-4">
                        <p className="tw-text-iron-300 tw-text-sm tw-line-clamp-6 tw-text-center">
                          {drop.parts?.[0]?.content || "No content"}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="tw-absolute tw-top-3 tw-right-3 tw-opacity-0 desktop-hover:group-hover:tw-opacity-100 tw-transition-opacity tw-duration-300">
                    <div className="tw-w-8 tw-h-8 tw-bg-black/50 tw-backdrop-blur-sm tw-rounded-full tw-flex tw-items-center tw-justify-center">
                      <FontAwesomeIcon
                        icon={faEye}
                        className="tw-w-3.5 tw-h-3.5 tw-text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="tw-p-3 tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-800 tw-bg-iron-950/50 tw-flex tw-flex-col tw-flex-1 tw-justify-between">
                  <div className="tw-flex tw-justify-between tw-items-start tw-mb-3">
                    <div className="tw-min-w-0 tw-flex-1 tw-mr-2">
                      {drop.title && (
                        <p className="tw-mb-0 tw-text-sm tw-font-bold tw-text-iron-100 tw-truncate tw-leading-tight">
                          {drop.title}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="tw-mb-3">
                    <div className="tw-flex tw-items-center tw-gap-x-1.5 tw-flex-wrap">
                      <div className="tw-flex tw-items-center tw-gap-x-1.5 tw-text-sm">
                        <span className="tw-text-[#D4AF37] tw-font-medium">
                          {formatNumberWithCommas(drop.rating)}
                        </span>
                      </div>
                      <div className="tw-text-sm tw-text-iron-500 tw-whitespace-nowrap">
                        <span className="tw-font-medium">
                          {drop.wave.voting_credit_type} total
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Voters */}
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <div className="tw-flex tw-items-center -tw-space-x-2">
                      {drop.top_raters.slice(0, 3).map((voter) => (
                        <div key={voter.profile.handle}>
                          <Link href={`/${voter.profile.handle}`}>
                            {voter.profile.pfp ? (
                              <img
                                className="tw-w-6 tw-h-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800 tw-object-contain"
                                src={voter.profile.pfp}
                                alt="Voter avatar"
                                data-tooltip-id={`winning-voter-${drop.id}-${voter.profile.handle}`}
                              />
                            ) : (
                              <div
                                className="tw-w-6 tw-h-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800"
                                data-tooltip-id={`winning-voter-${drop.id}-${voter.profile.handle}`}
                              />
                            )}
                          </Link>
                          <Tooltip
                            id={`winning-voter-${drop.id}-${voter.profile.handle}`}
                            style={{
                              backgroundColor: "#1F2937",
                              color: "white",
                              padding: "4px 8px",
                            }}
                          >
                            {voter.profile.handle} -{" "}
                            {formatNumberWithCommas(voter.rating)}
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                    <span className="tw-text-white tw-font-bold tw-text-xs">
                      {formatNumberWithCommas(drop.raters_count)}{" "}
                      <span className="tw-text-iron-500 tw-font-normal">
                        {drop.raters_count === 1 ? "voter" : "voters"}
                      </span>
                    </span>
                  </div>

                  {/* Decision time */}
                  <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-iron-500 tw-mt-3">
                    {decisionTime ? (
                      <>
                        <FontAwesomeIcon
                          icon={faTrophy}
                          className="tw-w-4 tw-h-4 tw-flex-shrink-0 tw-text-[#D4AF37]"
                        />
                        <span>
                          Won on{" "}
                          {Time.millis(decisionTime)
                            .toDate()
                            .toLocaleDateString()}
                        </span>
                      </>
                    ) : (
                      <>
                        <CalendarDaysIcon className="tw-w-4 tw-h-4 tw-flex-shrink-0" />
                        <span>
                          {Time.millis(drop.created_at)
                            .toDate()
                            .toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
