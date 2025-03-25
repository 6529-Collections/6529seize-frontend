import React, { useState, useCallback } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { useDropInteractionRules } from "../../../hooks/drops/useDropInteractionRules";
import MemesLeaderboardDropCard from "./MemesLeaderboardDropCard";
import MemesLeaderboardDropHeader from "./MemesLeaderboardDropHeader";
import MemesLeaderboardDropDescription from "./MemesLeaderboardDropDescription";
import MemesLeaderboardDropVoteSummary from "./MemesLeaderboardDropVoteSummary";
import MemesLeaderboardDropArtistInfo from "./MemesLeaderboardDropArtistInfo";
import MemesLeaderboardDropArtworkPreview from "./MemesLeaderboardDropArtworkPreview";
import MemesLeaderboardDropVotingSection from "./MemesLeaderboardDropVotingSection";
import MemeDropTraits from "./MemeDropTraits";
import useIsMobileDevice from "../../../hooks/isMobileDevice";
import WaveDropMobileMenu from "../../waves/drops/WaveDropMobileMenu";
import WaveDropActions from "../../waves/drops/WaveDropActions";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import { DropInteractionParams, DropLocation } from "../../waves/drops/Drop";
interface MemesLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropClick?: (drop: ExtendedDrop) => void;
}

export const MemesLeaderboardDrop: React.FC<MemesLeaderboardDropProps> = ({
  drop,
  activeDrop,
  showReplyAndQuote,
  location,
  onReply,
  onQuote,
  onDropClick,
}) => {
  const { canShowVote } = useDropInteractionRules(drop);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const isMobile = useIsMobileDevice();

  const onViewLarger = () => {
    setIsImageModalOpen(true);
  };

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

  // Extract metadata
  const title =
    drop.metadata?.find((m) => m.data_key === "title")?.data_value ||
    "Artwork Title";
  const description =
    drop.metadata?.find((m) => m.data_key === "description")?.data_value ||
    "This is an artwork submission for The Memes collection.";

  // Get artwork media URL if available
  const artworkMedia = drop.parts.at(0)?.media.at(0)?.url || null;

  // Get top voters for votes display
  const firstThreeVoters = drop.top_raters?.slice(0, 3) || [];

  return (
    <>
      <div className="tw-w-full">
        <div
          className={`tw-w-full tw-group tw-relative ${
            location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""
          }`}
        >
          <MemesLeaderboardDropCard drop={drop}>
            <div>
              {/* Left column - Metadata */}
              <div className="tw-p-4">
                {/* Header with metadata */}
                <div className="tw-flex tw-flex-col tw-gap-y-4">
                  <MemesLeaderboardDropArtistInfo drop={drop} />

                  <div className="tw-space-y-1">
                    <MemesLeaderboardDropHeader
                      title={title}
                      rank={drop.rank}
                      decisionTime={drop.winning_context?.decision_time || null}
                    />
                    <MemesLeaderboardDropDescription
                      description={description}
                    />
                  </div>
                </div>
              </div>

              <MemesLeaderboardDropArtworkPreview
                artworkMedia={artworkMedia}
                title={title}
                onViewLarger={onViewLarger}
              />
              <div className="tw-p-4">
                <MemeDropTraits drop={drop} />
              </div>
              <div className="tw-flex tw-flex-col tw-px-4 tw-pb-4">
                <MemesLeaderboardDropVoteSummary
                  rating={drop.rating || 0}
                  creditType={drop.wave.voting_credit_type}
                  ratersCount={drop.raters_count || 0}
                  topVoters={firstThreeVoters}
                />
              </div>
            </div>

            {/* Voting section - spanning both columns */}
            <MemesLeaderboardDropVotingSection
              drop={drop}
              canShowVote={canShowVote}
            />

            {/* Actions component (desktop only) - Moved outside the card to work with hover */}
          </MemesLeaderboardDropCard>
          
          {/* Actions component (desktop only) */}
          {!isMobile && showReplyAndQuote && (
            <WaveDropActions
              drop={drop}
              activePartIndex={0}
              onReply={handleOnReply}
              onQuote={handleOnQuote}
            />
          )}
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
    </>
  );
};

export default MemesLeaderboardDrop;
