"use client"

import React, { useCallback } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { DropInteractionParams, DropLocation } from "../../waves/drops/Drop";
import useIsMobileDevice from "../../../hooks/isMobileDevice";
import WaveDropActions from "../../waves/drops/WaveDropActions";
import MemeWinnerHeader from "./MemeWinnerHeader";
import MemeWinnerDescription from "./MemeWinnerDescription";
import MemeWinnerArtistInfo from "./MemeWinnerArtistInfo";
import MemeDropTraits from "./MemeDropTraits";
import DropMobileMenuHandler from "../../waves/drops/DropMobileMenuHandler";
import DropListItemContentMedia from "../../drops/view/item/content/media/DropListItemContentMedia";
import { useDropContext } from "../../waves/drops/DropContext";

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
    "tw-shadow-[inset_1px_0_0_#fbbf24,inset_0_1px_0_rgba(251,191,36,0.2),inset_-1px_0_0_rgba(251,191,36,0.2),inset_0_-1px_0_rgba(251,191,36,0.2)]";

  return (
    <div className="tw-w-full">
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
              <div className="tw-p-4">
                <div className="tw-flex tw-flex-col tw-gap-4">
                  <MemeWinnerArtistInfo drop={drop} />
                </div>
                <div className="tw-flex tw-flex-col tw-mt-2 sm:tw-mt-1.5 sm:tw-ml-[3.25rem]">
                  <MemeWinnerHeader title={title} />
                  <MemeWinnerDescription description={description} />
                </div>
              </div>

              {artworkMedia && (
                <div className={`tw-flex tw-justify-center tw-mx-[1px] tw-h-96 ${
                  location === DropLocation.WAVE ? "tw-bg-iron-800/30" : ""
                }`}>
                  <DropListItemContentMedia
                    media_mime_type={artworkMedia.mime_type}
                    media_url={artworkMedia.url}
                    isCompetitionDrop={true}
                  />
                </div>
              )}
            
                <MemeDropTraits drop={drop} />
             
            </>
          </DropMobileMenuHandler>
          {/* Actions for desktop */}
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
