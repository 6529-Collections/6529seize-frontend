import React, { useState, useCallback } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import { DropInteractionParams, DropLocation } from "../../waves/drops/Drop";
import { useDropInteractionRules } from "../../../hooks/drops/useDropInteractionRules";
import useIsMobileDevice from "../../../hooks/isMobileDevice";
import WaveDropMobileMenu from "../../waves/drops/WaveDropMobileMenu";

// Import new components
import MemeDropHeader from "./meme-participation-drop/MemeDropHeader";
import MemeDropDescription from "./meme-participation-drop/MemeDropDescription";
import MemeDropVoteStats from "./meme-participation-drop/MemeDropVoteStats";
import MemeDropArtistInfo from "./meme-participation-drop/MemeDropArtistInfo";
import MemeDropArtwork from "./meme-participation-drop/MemeDropArtwork";
import MemeDropVotingSection from "./meme-participation-drop/MemeDropVotingSection";
import MemeDropActions from "./meme-participation-drop/MemeDropActions";

interface MemeParticipationDropProps {
  readonly drop: ExtendedDrop;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}

// Border styling based on rank
const getBorderClasses = (drop: ExtendedDrop, isActiveDrop: boolean) => {
  const rank = drop.rank && drop.rank <= 3 ? drop.rank : null;

  const baseClasses =
    "tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-transition-all tw-duration-200 tw-ease-out tw-overflow-hidden";

  if (isActiveDrop) {
    return `${baseClasses} desktop-hover:hover:tw-border-[#3CCB7F]/40 tw-bg-[#3CCB7F]/5`;
  } else if (rank === 1) {
    return `${baseClasses} desktop-hover:hover:tw-border-[#fbbf24]/40`;
  } else if (rank === 2) {
    return `${baseClasses} desktop-hover:hover:tw-border-[#94a3b8]/40`;
  } else if (rank === 3) {
    return `${baseClasses} desktop-hover:hover:tw-border-[#CD7F32]/40`;
  } else {
    return `${baseClasses} tw-border-iron-800`;
  }
};

/**
 * Special version of ParticipationDrop for the Memes wave
 * This component features a 2-column layout with artwork on the right
 */
export default function MemeParticipationDrop({
  drop,
  activeDrop,
  showReplyAndQuote,
  location,
  onReply,
  onQuote,
  onDropContentClick,
}: MemeParticipationDropProps) {
  const { canShowVote } = useDropInteractionRules(drop);
  const isActiveDrop = activeDrop?.drop.id === drop.id;

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
  const artworkMedia = drop.parts.at(0)?.media.at(0)?.url;

  const borderClasses = getBorderClasses(drop, isActiveDrop);

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

  return (
    <div className="tw-w-full">
      <div
        className={`tw-w-full tw-group tw-relative ${
          location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""
        }`}
      >
        <div
          className={`${borderClasses} ${
            location === DropLocation.WAVE ? "tw-bg-iron-900" : "tw-bg-iron-950"
          }`}
        >
          {/* Two-column layout */}
          <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-12 tw-gap-5">
            {/* Left column - Metadata */}
            <div className="tw-col-span-1 xl:tw-col-span-5 tw-px-4 tw-pt-4 tw-pb-4">
              {/* Header with metadata */}
              <div className="tw-flex tw-flex-col tw-gap-y-1">
                {/* Header component */}
                <MemeDropHeader
                  title={title}
                  rank={drop.rank}
                  decisionTime={drop.winning_context?.decision_time || null}
                />
                {/* Description component */}
                <MemeDropDescription description={description} />
              </div>

              {/* Vote count section */}
              <div className="tw-flex tw-flex-col tw-gap-y-4 tw-mt-4">
                {/* Vote stats component */}
                <MemeDropVoteStats
                  rating={drop.rating}
                  votingCreditType={drop.wave.voting_credit_type}
                  ratersCount={drop.raters_count}
                  topVoters={drop.top_raters || []}
                />
              </div>
              {/* Artist info component */}
              <div className="tw-mt-4">
                <MemeDropArtistInfo drop={drop} />
              </div>
            </div>

            {/* Artwork component */}
            <MemeDropArtwork
              artworkMedia={artworkMedia}
              title={title}
              onViewLarger={handleViewLarger}
            />
          </div>

          {/* Voting section component */}
          {canShowVote && <MemeDropVotingSection drop={drop} />}

          {/* Actions component (desktop only) */}
          <MemeDropActions
            drop={drop}
            isMobile={isMobile}
            showReplyAndQuote={showReplyAndQuote}
            onReply={handleOnReply}
            onQuote={handleOnQuote}
          />
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
