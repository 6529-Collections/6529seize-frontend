import React from "react";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import type { CollectedCard } from "@/entities/IProfile";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useUserPrevoteCards } from "@/hooks/useUserPrevoteCards";
import { useUserWinningArtworks } from "@/hooks/useUserWinningArtworks";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { faEye, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { Tooltip } from "react-tooltip";
import { ArtistPrevoteCollectedCard } from "./ArtistPrevoteCollectedCard";

interface ArtistWinningArtworksContentProps {
  readonly user: ApiProfileMin;
  readonly isOpen: boolean;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

type TrophyItem =
  | { readonly type: "winner"; readonly key: string; readonly drop: ApiDrop }
  | {
      readonly type: "prevote";
      readonly key: string;
      readonly card: CollectedCard;
    };

const TROPHY_LABEL_BASE_CLASS =
  "tw-pointer-events-none tw-absolute tw-left-3 tw-top-3 tw-z-10 tw-rounded-full tw-border tw-border-solid tw-px-2.5 tw-py-1 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wide";

const WinnerTrophyCard: React.FC<{
  readonly drop: ApiDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}> = ({ drop, onDropClick }) => {
  const extendedDrop = convertApiDropToExtendedDrop(drop);
  const decisionTime = drop.winning_context?.decision_time;

  return (
    <div
      data-testid="trophy-item-winner"
      className="tw-flex tw-h-full tw-flex-col"
    >
      <div
        className="tw-group tw-relative tw-flex tw-flex-1 tw-cursor-pointer tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/50 tw-shadow-lg tw-transition-all tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-shadow-xl"
        onClick={() => onDropClick(extendedDrop)}
      >
        <span
          className={`${TROPHY_LABEL_BASE_CLASS} tw-border-amber-300/40 tw-bg-amber-900/65 tw-text-amber-100`}
        >
          Main Stage Winner
        </span>

        <div className="tw-relative tw-aspect-square tw-overflow-hidden tw-bg-iron-950/50">
          <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center">
            {drop.parts[0]?.media && drop.parts[0].media.length > 0 ? (
              <MediaDisplay
                media_url={drop.parts[0].media[0]!.url}
                media_mime_type={drop.parts[0].media[0]!.mime_type}
                disableMediaInteraction={true}
              />
            ) : (
              <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-950 tw-p-4">
                <p className="tw-line-clamp-6 tw-text-center tw-text-sm tw-text-iron-300">
                  {drop.parts[0]?.content ?? "No content"}
                </p>
              </div>
            )}
          </div>
          <div className="tw-absolute tw-right-3 tw-top-3 tw-opacity-0 tw-transition-opacity tw-duration-300 desktop-hover:group-hover:tw-opacity-100">
            <div className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-bg-black/50 tw-backdrop-blur-sm">
              <FontAwesomeIcon
                icon={faEye}
                className="tw-h-3.5 tw-w-3.5 tw-text-white"
              />
            </div>
          </div>
        </div>

        <div className="tw-flex tw-flex-1 tw-flex-col tw-justify-between tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950/50 tw-p-3">
          <div className="tw-mb-3 tw-flex tw-items-start tw-justify-between">
            <div className="tw-mr-2 tw-min-w-0 tw-flex-1">
              {drop.title && (
                <p className="tw-mb-0 tw-truncate tw-text-sm tw-font-bold tw-leading-tight tw-text-iron-100">
                  {drop.title}
                </p>
              )}
            </div>
          </div>

          <div className="tw-mb-3">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-1.5">
              <div className="tw-flex tw-items-center tw-gap-x-1.5 tw-text-sm">
                <span className="tw-font-medium tw-text-[#D4AF37]">
                  {formatNumberWithCommas(drop.rating)}
                </span>
              </div>
              <div className="tw-whitespace-nowrap tw-text-sm tw-text-iron-500">
                <span className="tw-font-medium">
                  {drop.wave.voting_credit_type} total
                </span>
              </div>
            </div>
          </div>

          <div className="tw-flex tw-items-center tw-gap-2">
            <div className="tw-flex tw-items-center -tw-space-x-2">
              {drop.top_raters.slice(0, 3).map((voter) => (
                <div key={voter.profile.handle}>
                  <Link
                    href={`/${voter.profile.handle ?? voter.profile.primary_address}`}
                  >
                    {voter.profile.pfp ? (
                      <Image
                        className="tw-h-6 tw-w-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800 tw-object-contain"
                        src={getScaledImageUri(
                          voter.profile.pfp,
                          ImageScale.W_AUTO_H_50
                        )}
                        alt={
                          voter.profile.handle ?? voter.profile.primary_address
                        }
                        width={24}
                        height={24}
                        data-tooltip-id={`winning-voter-${drop.id}-${voter.profile.handle ?? voter.profile.primary_address}`}
                      />
                    ) : (
                      <div
                        className="tw-h-6 tw-w-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800"
                        data-tooltip-id={`winning-voter-${drop.id}-${voter.profile.handle ?? voter.profile.primary_address}`}
                      />
                    )}
                  </Link>
                  <Tooltip
                    id={`winning-voter-${drop.id}-${voter.profile.handle ?? voter.profile.primary_address}`}
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
            <span className="tw-text-xs tw-font-bold tw-text-white">
              {formatNumberWithCommas(drop.raters_count)}{" "}
              <span className="tw-font-normal tw-text-iron-500">
                {drop.raters_count === 1 ? "voter" : "voters"}
              </span>
            </span>
          </div>

          <div className="tw-mt-3 tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-iron-500">
            {typeof decisionTime === "number" ? (
              <>
                <FontAwesomeIcon
                  icon={faTrophy}
                  className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-[#D4AF37]"
                />
                <span>
                  Won on{" "}
                  {Time.millis(decisionTime).toDate().toLocaleDateString()}
                </span>
              </>
            ) : (
              <>
                <CalendarDaysIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
                <span>
                  {Time.millis(drop.created_at).toDate().toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ArtistWinningArtworksContent: React.FC<
  ArtistWinningArtworksContentProps
> = ({ user, isOpen, onDropClick }) => {
  const { winningDrops, isLoading: isWinningDropsLoading } =
    useUserWinningArtworks({
      user,
      enabled: isOpen,
    });
  const { prevoteCards, isLoading: isPrevoteCardsLoading } =
    useUserPrevoteCards({
      user,
      enabled: isOpen,
    });

  const isLoading = isWinningDropsLoading || isPrevoteCardsLoading;
  const trophyItems = React.useMemo<TrophyItem[]>(
    () => [
      ...winningDrops.map((drop) => ({
        type: "winner" as const,
        key: `winner-${drop.id}`,
        drop,
      })),
      ...prevoteCards.map((card) => ({
        type: "prevote" as const,
        key: `artist-prevote-card-${card.token_id}`,
        card,
      })),
    ],
    [prevoteCards, winningDrops]
  );

  if (isLoading) {
    return (
      <div className="tw-flex tw-h-96 tw-items-center tw-justify-center">
        <div className="tw-flex tw-flex-col tw-items-center tw-gap-4">
          <div className="tw-h-8 tw-w-8 tw-animate-spin tw-rounded-full tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-amber-400"></div>
          <span className="tw-animate-fade-in-out tw-text-sm tw-text-iron-400">
            Loading trophy artworks...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-relative tw-z-[100] tw-max-h-[calc(75vh-120px)] tw-overflow-y-auto tw-p-6 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 sm:tw-max-h-[calc(90vh-140px)]">
      {trophyItems.length > 0 && (
        <>
          <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
            <span className="tw-rounded-full tw-border tw-border-solid tw-border-amber-300/30 tw-bg-amber-900/25 tw-px-2.5 tw-py-1 tw-text-amber-100/90">
              Main Stage Winners: {winningDrops.length}
            </span>
            <span className="tw-rounded-full tw-border tw-border-solid tw-border-blue-300/30 tw-bg-blue-900/20 tw-px-2.5 tw-py-1 tw-text-blue-100/90">
              Artist of Prevote Cards: {prevoteCards.length}
            </span>
          </div>

          <div className="tw-grid tw-grid-cols-1 tw-gap-6 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
            {trophyItems.map((item) =>
              item.type === "winner" ? (
                <WinnerTrophyCard
                  key={item.key}
                  drop={item.drop}
                  onDropClick={onDropClick}
                />
              ) : (
                <div
                  key={item.key}
                  data-testid="trophy-item-prevote"
                  className="tw-relative tw-flex tw-h-full tw-flex-col"
                >
                  <span
                    className={`${TROPHY_LABEL_BASE_CLASS} tw-border-blue-300/40 tw-bg-blue-900/65 tw-text-blue-100`}
                  >
                    Artist of Prevote
                  </span>
                  <ArtistPrevoteCollectedCard card={item.card} />
                </div>
              )
            )}
          </div>
        </>
      )}

      {trophyItems.length === 0 && (
        <div className="tw-flex tw-h-72 tw-items-center tw-justify-center">
          <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
            No trophy artworks found.
          </p>
        </div>
      )}
    </div>
  );
};
