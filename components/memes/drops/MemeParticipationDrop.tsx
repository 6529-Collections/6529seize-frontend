"use client";

import React, { useCallback, useState } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import { DropInteractionParams, DropLocation } from "../../waves/drops/Drop";
import { useDropInteractionRules } from "../../../hooks/drops/useDropInteractionRules";
import useIsMobileDevice from "../../../hooks/isMobileDevice";
import useIsMobileScreen from "../../../hooks/isMobileScreen";
import MemeDropHeader from "./meme-participation-drop/MemeDropHeader";
import MemeDropDescription from "./meme-participation-drop/MemeDropDescription";
import MemeDropVoteStats from "./meme-participation-drop/MemeDropVoteStats";
import MemeDropArtistInfo from "./meme-participation-drop/MemeDropArtistInfo";
import MemeDropActions from "./meme-participation-drop/MemeDropActions";
import MemeDropTraits from "./MemeDropTraits";
import DropMobileMenuHandler from "../../waves/drops/DropMobileMenuHandler";
import DropListItemContentMedia from "../../drops/view/item/content/media/DropListItemContentMedia";
import { VotingModal, MobileVotingModal } from "../../voting";
import VotingModalButton from "../../voting/VotingModalButton";
import WaveDropReactions from "../../waves/drops/WaveDropReactions";

interface MemeParticipationDropProps {
  readonly drop: ExtendedDrop;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
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

export default function MemeParticipationDrop({
  drop,
  activeDrop,
  showReplyAndQuote,
  location,
  onReply,
  onQuote,
}: MemeParticipationDropProps) {
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const { canShowVote } = useDropInteractionRules(drop);
  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const isMobile = useIsMobileDevice();
  const isMobileScreen = useIsMobileScreen();

  // Extract metadata
  const title =
    drop.metadata?.find((m) => m.data_key === "title")?.data_value ??
    "Artwork Title";
  const description =
    drop.metadata?.find((m) => m.data_key === "description")?.data_value ??
    "This is an artwork submission for The Memes collection.";

  // Get artwork media URL if available
  const artworkMedia = drop.parts.at(0)?.media.at(0);

  const borderClasses = getBorderClasses(drop, isActiveDrop);

  const handleOnReply = useCallback(() => {
    onReply({ drop, partId: drop.parts[0].part_id });
  }, [onReply, drop]);

  const handleOnQuote = useCallback(() => {
    onQuote({ drop, partId: drop.parts[0].part_id });
  }, [onQuote, drop]);

  return (
    <div className="tw-w-full tw-@container">
      <div
        className={`tw-w-full tw-group tw-relative ${
          location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""
        }`}>
        <div
          className={`${borderClasses} ${
            location === DropLocation.WAVE
              ? "tw-bg-iron-900/80"
              : "tw-bg-iron-950"
          }`}>
          <DropMobileMenuHandler
            drop={drop}
            showReplyAndQuote={showReplyAndQuote}
            onReply={handleOnReply}
            onQuote={handleOnQuote}>
            <>
              <div className="tw-p-4">
                <MemeDropArtistInfo drop={drop} />
                <div className="tw-flex tw-flex-col tw-mt-2 sm:tw-mt-1.5 sm:tw-ml-[3.25rem]">
                  <MemeDropHeader title={title} />
                  <MemeDropDescription description={description} />
                </div>
              </div>
              {artworkMedia && (
                <div
                  className={`tw-flex tw-justify-center tw-h-96 ${
                    location === DropLocation.WAVE
                      ? "tw-bg-iron-800/30"
                      : "tw-bg-iron-900/40"
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
          <div className="tw-flex tw-flex-col @[700px]:tw-flex-row tw-gap-3 @[700px]:tw-gap-y-0 tw-justify-between @[700px]:tw-items-center @[700px]:tw-px-4 tw-pb-4">
            <div className="tw-px-4 @[700px]:tw-px-0">
              <MemeDropVoteStats
                current={drop.rating}
                projected={drop.rating_prediction}
                votingCreditType={drop.wave.voting_credit_type}
                ratersCount={drop.raters_count}
                topVoters={drop.top_raters ?? []}
                userContext={drop.context_profile_context}
              />
            </div>

            {canShowVote && (
              <div className="tw-pt-4 tw-px-6 tw-flex tw-justify-center @[700px]:tw-pt-0 @[700px]:tw-px-0 tw-w-full @[700px]:tw-w-auto tw-border-t tw-border-solid tw-border-iron-800 @[700px]:tw-border-none tw-border-x-0 tw-border-b-0">
                <div onClick={(e) => e.stopPropagation()}>
                  <VotingModalButton
                    drop={drop}
                    onClick={() => setIsVotingModalOpen(true)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="tw-px-4 tw-pb-4 tw-flex tw-w-full tw-items-center tw-gap-x-2 tw-gap-y-1 tw-flex-wrap">
            <WaveDropReactions drop={drop} />
          </div>

          <div className="tw-absolute tw-right-4 tw-top-2">
            <MemeDropActions
              drop={drop}
              isMobile={isMobile}
              showReplyAndQuote={showReplyAndQuote}
              onReply={handleOnReply}
              onQuote={handleOnQuote}
            />
          </div>
        </div>

        {isMobileScreen ? (
          <MobileVotingModal
            drop={drop}
            isOpen={isVotingModalOpen}
            onClose={() => setIsVotingModalOpen(false)}
          />
        ) : (
          <VotingModal
            drop={drop}
            isOpen={isVotingModalOpen}
            onClose={() => setIsVotingModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
