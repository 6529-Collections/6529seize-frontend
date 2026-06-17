"use client";

import { useCallback, type ReactNode } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  getRankHoverBorderClass,
  getRankStaticBorderClass,
} from "@/components/waves/drops/dropRankStyles";
import { AdditionalActionPromiseBadge } from "@/components/waves/drops/AdditionalActionPromiseBadge";
import type { DropInteractionParams } from "@/components/waves/drops/drop.types";
import {
  DropLocation,
  hasDropFooter,
} from "@/components/waves/drops/drop.types";
import useDropActionInteractionMode from "@/hooks/useDropActionInteractionMode";
import WaveDropActions from "@/components/waves/drops/WaveDropActions";
import MemeWinnerHeader from "./MemeWinnerHeader";
import MemeWinnerDescription from "./MemeWinnerDescription";
import MemeWinnerArtistInfo from "./MemeWinnerArtistInfo";
import MemeDropTraits from "./MemeDropTraits";
import MemeDropVoteStats from "./meme-participation-drop/MemeDropVoteStats";
import DropMobileMenuHandler from "@/components/waves/drops/DropMobileMenuHandler";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { useDropContext } from "@/components/waves/drops/DropContext";
import { WaveWinnerIdentity } from "@/components/waves/winners/identity/WaveWinnerIdentity";

interface MemeWinnerDropProps {
  readonly drop: ExtendedDrop;
  readonly showReplyAndQuote: boolean;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly footer?: ReactNode;
  readonly showInteractions?: boolean | undefined;
}

const getRankHoverClass = (rank: number | null): string => {
  return getRankHoverBorderClass(rank);
};

const getNonEmptyText = (
  value: string | null | undefined
): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const getMetadataValue = (
  drop: ExtendedDrop,
  dataKey: string
): string | undefined =>
  getNonEmptyText(
    drop.metadata.find((metadata) => metadata.data_key === dataKey)?.data_value
  );

export default function MemeWinnerDrop({
  drop,
  showReplyAndQuote,
  onReply,
  footer,
  showInteractions = true,
}: MemeWinnerDropProps) {
  const { canUseDesktopHoverActions } = useDropActionInteractionMode();
  const { location } = useDropContext();

  // Extract metadata
  const title =
    getNonEmptyText(drop.title) ??
    getMetadataValue(drop, "title") ??
    "Artwork Title";
  const description =
    getNonEmptyText(drop.parts.at(0)?.content) ??
    getMetadataValue(drop, "description") ??
    "This is an artwork submission for The Memes collection.";

  // Get artwork media URL if available
  const artworkMedia = drop.parts.at(0)?.media.at(0);
  const headerContent = (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
      <MemeWinnerHeader title={title} />
      {drop.is_additional_action_promised === true && (
        <AdditionalActionPromiseBadge />
      )}
    </div>
  );

  const handleOnReply = useCallback(() => {
    onReply({ drop, partId: drop.parts[0]?.part_id! });
  }, [onReply, drop]);
  const effectiveRank = drop.winning_context?.place ?? drop.rank;

  const content = (
    <>
      <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-bg-iron-900/30 tw-p-4 tw-pb-3">
        <MemeWinnerArtistInfo drop={drop} />
      </div>

      <div className="tw-px-4 tw-pb-4 tw-pt-4">
        <div className="tw-space-y-1">
          {headerContent}
          <MemeWinnerDescription description={description} />
        </div>
      </div>

      <WaveWinnerIdentity
        drop={drop}
        variant="full"
        className="tw-px-4 tw-pb-4"
      />

      {artworkMedia && (
        <div className="tw-mx-0.5 tw-flex tw-h-96 tw-justify-center tw-bg-iron-950">
          <DropListItemContentMedia
            media_mime_type={artworkMedia.mime_type}
            media_url={artworkMedia.url}
            isCompetitionDrop={true}
          />
        </div>
      )}

      <div className="tw-mt-4 tw-hidden tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-bg-iron-900/30 tw-p-4 lg:tw-block">
        <MemeDropTraits drop={drop} />
      </div>
    </>
  );

  return (
    <div className="tw-mb-3 tw-w-full">
      <div
        className={`tw-w-full ${
          location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""
        } tw-group tw-relative`}
      >
        <div
          className={`tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid ${getRankStaticBorderClass(
            effectiveRank
          )} tw-transition-all tw-duration-200 tw-ease-out ${
            location === DropLocation.WAVE
              ? "tw-bg-iron-900/80"
              : "tw-bg-iron-950"
          } ${getRankHoverClass(effectiveRank)}`}
        >
          {showInteractions ? (
            <DropMobileMenuHandler
              drop={drop}
              showReplyAndQuote={showReplyAndQuote}
              onReply={handleOnReply}
            >
              {content}
            </DropMobileMenuHandler>
          ) : (
            content
          )}
          <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-bg-iron-900/30 tw-px-4 tw-py-4">
            <MemeDropVoteStats drop={drop} />
          </div>
          {hasDropFooter(footer) && (
            <div className="tw-px-4 tw-pb-4 tw-pt-2">{footer}</div>
          )}
          {canUseDesktopHoverActions &&
            showInteractions &&
            showReplyAndQuote && (
              <div className="tw-absolute tw-right-4 tw-top-2">
                <WaveDropActions
                  drop={drop}
                  activePartIndex={0}
                  onReply={handleOnReply}
                />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
