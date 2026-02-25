"use client";

import { useCallback } from "react";

import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import { DropLocation } from "@/components/waves/drops/Drop";
import { useDropContext } from "@/components/waves/drops/DropContext";
import DropMobileMenuHandler from "@/components/waves/drops/DropMobileMenuHandler";
import WaveDropActions from "@/components/waves/drops/WaveDropActions";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useIsMobileDevice from "@/hooks/isMobileDevice";

import MemeDropTraits from "./MemeDropTraits";
import MemeWinnerArtistInfo from "./MemeWinnerArtistInfo";
import MemeWinnerDescription from "./MemeWinnerDescription";
import MemeWinnerHeader from "./MemeWinnerHeader";


interface MemeWinnerDropProps {
  readonly drop: ExtendedDrop;
  readonly showReplyAndQuote: boolean;
  readonly onReply: (param: DropInteractionParams) => void;
}

export default function MemeWinnerDrop({
  drop,
  showReplyAndQuote,
  onReply,
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
    onReply({ drop, partId: drop.parts[0]?.part_id! });
  }, [onReply, drop]);

  // First place shadow class from DefaultWaveWinnerDrop
  const firstPlaceShadow =
    "tw-shadow-[inset_1px_0_0_rgba(251,191,36,0.5),inset_0_1px_0_rgba(251,191,36,0.2),inset_-1px_0_0_rgba(251,191,36,0.2),inset_0_-1px_0_rgba(251,191,36,0.2)]";

  return (
    <div className="tw-mb-3 tw-w-full">
      <div
        className={`tw-w-full ${
          location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""
        } tw-group tw-relative`}
      >
        <div
          className={`tw-overflow-hidden tw-rounded-xl tw-border tw-border-l tw-border-solid tw-border-transparent tw-transition-all tw-duration-200 tw-ease-out ${
            location === DropLocation.WAVE
              ? "tw-bg-iron-900/80"
              : "tw-bg-iron-950"
          } ${firstPlaceShadow}`}
        >
          <DropMobileMenuHandler
            drop={drop}
            showReplyAndQuote={showReplyAndQuote}
            onReply={handleOnReply}
          >
            <>
              <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-bg-iron-900/30 tw-p-4 tw-pb-3">
                <MemeWinnerArtistInfo drop={drop} />
              </div>

              <div className="tw-px-4 tw-pb-4 tw-pt-4">
                <div className="tw-space-y-1">
                  <MemeWinnerHeader title={title} />
                  <MemeWinnerDescription description={description} />
                </div>
              </div>

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
          </DropMobileMenuHandler>
          {!isMobile && showReplyAndQuote && (
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
