import React, { useState, useCallback } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import { DropInteractionParams, DropLocation } from "../../waves/drops/Drop";
import useIsMobileDevice from "../../../hooks/isMobileDevice";
import WaveDropMobileMenu from "../../waves/drops/WaveDropMobileMenu";
import WaveDropActions from "../../waves/drops/WaveDropActions";
import MemeWinnerHeader from "./MemeWinnerHeader";
import MemeWinnerDescription from "./MemeWinnerDescription";
import MemeWinnerArtistInfo from "./MemeWinnerArtistInfo";
import MemeWinnerArtwork from "./MemeWinnerArtwork";

interface MemeWinnerDropProps {
  readonly drop: ExtendedDrop;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}

export default function MemeWinnerDrop({
  drop,
  activeDrop,
  showReplyAndQuote,
  location,
  onReply,
  onQuote,
  onDropContentClick,
}: MemeWinnerDropProps) {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const isMobile = useIsMobileDevice();

  // Extract metadata
  const title =
    drop.metadata?.find((m) => m.data_key === "title")?.data_value ||
    "Artwork Title";
  const description =
    drop.metadata?.find((m) => m.data_key === "description")?.data_value ||
    "This is an artwork submission for The Memes collection.";

  // Get artwork media URL if available
  const artworkMedia = drop.parts.at(0)?.media?.at(0)?.url;
  const decisionTime = drop.winning_context?.decision_time;

  const handleLongPress = useCallback(() => {
    if (!isMobile) return;
    setLongPressTriggered(true);
    setIsSlideUp(true);
  }, [isMobile]);

  const handleOnReply = useCallback(() => {
    setIsSlideUp(false);
    onReply({ drop, partId: drop.parts[0].part_id });
  }, [onReply, drop]);

  const handleOnQuote = useCallback(() => {
    setIsSlideUp(false);
    onQuote({ drop, partId: drop.parts[0].part_id });
  }, [onQuote, drop]);

  const handleViewLarger = () => {
    console.log("view larger");
  };

  // First place shadow class from DefaultWaveWinnerDrop
  const firstPlaceShadow =
    "tw-shadow-[inset_1px_0_0_#fbbf24,inset_0_1px_0_rgba(251,191,36,0.2),inset_-1px_0_0_rgba(251,191,36,0.2),inset_0_-1px_0_rgba(251,191,36,0.2)]";

  return (
    <div className="tw-w-full">
      <div
        className={`tw-w-full ${location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""
          } tw-relative tw-group`}
      >
        <div
          className={`tw-rounded-xl tw-border tw-border-solid tw-border-transparent tw-border-l tw-transition-all tw-duration-200 tw-ease-out tw-overflow-hidden ${location === DropLocation.WAVE ? 'tw-bg-iron-900' : 'tw-bg-iron-950'} ${firstPlaceShadow}`}
        >
          {/* Two-column layout */}
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-12 tw-gap-5">
            {/* Left column - Metadata */}
            <div className="tw-col-span-1 md:tw-col-span-5 tw-px-4 tw-pt-4">
              {/* Header with metadata */}
              <div className="tw-flex tw-flex-col tw-gap-y-4">
                <div className="tw-flex tw-flex-col tw-gap-y-1">
                  {/* Rank and title in the same row */}
                  <MemeWinnerHeader title={title} decisionTime={decisionTime} />

                  {/* Description on its own row */}
                  <MemeWinnerDescription description={description} />
                </div>

                {/* Vote count and artist info on the last row */}
                <div className="tw-flex tw-flex-col tw-gap-4">
                  {/* Artist info with CIC and level */}
                  <MemeWinnerArtistInfo drop={drop} />
                </div>
              </div>
            </div>

            {/* Right column - Artwork */}
            <MemeWinnerArtwork
              title={title}
              artworkMedia={artworkMedia}
              onViewLarger={handleViewLarger}
            />
          </div>

          {/* Actions for desktop */}
          {!isMobile && showReplyAndQuote && (
            <WaveDropActions
              drop={drop}
              activePartIndex={0}
              onReply={handleOnReply}
              onQuote={handleOnQuote}
            />
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <WaveDropMobileMenu
        drop={drop}
        isOpen={isSlideUp}
        longPressTriggered={longPressTriggered}
        showReplyAndQuote={showReplyAndQuote}
        setOpen={setIsSlideUp}
        onReply={handleOnReply}
        onQuote={handleOnQuote}
      />
    </div>
  );
}
