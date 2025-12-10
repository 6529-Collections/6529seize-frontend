"use client";

import React, { useCallback } from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  DropInteractionParams,
  DropLocation,
} from "@/components/waves/drops/Drop";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import WaveDropActions from "@/components/waves/drops/WaveDropActions";
import MemeWinnerHeader from "./MemeWinnerHeader";
import MemeWinnerDescription from "./MemeWinnerDescription";
import MemeWinnerArtistInfo from "./MemeWinnerArtistInfo";
import MemeDropTraits from "./MemeDropTraits";
import DropMobileMenuHandler from "@/components/waves/drops/DropMobileMenuHandler";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { useDropContext } from "@/components/waves/drops/DropContext";

interface MemeWinnerDropProps {
  readonly drop: ExtendedDrop;
  readonly showReplyAndQuote: boolean;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
}

export default function MemeWinnerDrop({
  drop,
  showReplyAndQuote,
  onReply,
  onQuote,
}: MemeWinnerDropProps) {
  const isMobile = useIsMobileDevice();
  const { location } = useDropContext();

  // Extract metadata
  const title =
    drop.metadata?.find((m) => m.data_key === "title")?.data_value ??
    "Artwork Title";
  const description =
    drop.metadata?.find((m) => m.data_key === "description")?.data_value ??
    "This is an artwork submission for The Memes collection.";

  // Get artwork media URL if available
  const artworkMedia = drop.parts.at(0)?.media?.at(0);

  const handleOnReply = useCallback(() => {
    onReply({ drop, partId: drop.parts[0].part_id });
  }, [onReply, drop]);

  const handleOnQuote = useCallback(() => {
    onQuote({ drop, partId: drop.parts[0].part_id });
  }, [onQuote, drop]);

  // First place shadow class from DefaultWaveWinnerDrop
  const firstPlaceShadow =
    "tw-shadow-[inset_1px_0_0_rgba(251,191,36,0.5),inset_0_1px_0_rgba(251,191,36,0.2),inset_-1px_0_0_rgba(251,191,36,0.2),inset_0_-1px_0_rgba(251,191,36,0.2)]";

  return (
    <div className="tw-w-full tw-mb-3">
      <div
        className={`tw-w-full ${
          location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""
        } tw-relative tw-group`}
      >
        <div
          className={`tw-rounded-xl tw-border tw-border-solid tw-border-transparent tw-border-l tw-transition-all tw-duration-200 tw-ease-out tw-overflow-hidden ${
            location === DropLocation.WAVE
              ? "tw-bg-iron-900/80"
              : "tw-bg-iron-950"
          } ${firstPlaceShadow}`}
        >
          <DropMobileMenuHandler
            drop={drop}
            showReplyAndQuote={showReplyAndQuote}
            onReply={handleOnReply}
            onQuote={handleOnQuote}
          >
            <>
              <div className="tw-p-4 tw-pb-3 tw-border-b tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-white/5 tw-bg-iron-900/30">
                <MemeWinnerArtistInfo drop={drop} />
              </div>

              <div className="tw-px-4 tw-pt-4 tw-pb-4">
                <div className="tw-space-y-1">
                  <MemeWinnerHeader title={title} />
                  <MemeWinnerDescription description={description} />
                </div>
              </div>

              {artworkMedia && (
                <div className="tw-flex tw-justify-center tw-h-96 tw-mx-0.5 tw-bg-iron-950">
                  <DropListItemContentMedia
                    media_mime_type={artworkMedia.mime_type}
                    media_url={artworkMedia.url}
                    isCompetitionDrop={true}
                  />
                </div>
              )}

              <div className="tw-hidden lg:tw-block tw-p-4 tw-mt-4 tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-white/5 tw-bg-iron-900/30">
                <MemeDropTraits drop={drop} />
              </div>
            </>
          </DropMobileMenuHandler>
          {!isMobile && showReplyAndQuote && (
            <div className="tw-absolute tw-right-4 tw-top-2">
              <WaveDropActions
                drop={drop}
                activePartIndex={0}
                onReply={handleOnReply}
                onQuote={handleOnQuote}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
