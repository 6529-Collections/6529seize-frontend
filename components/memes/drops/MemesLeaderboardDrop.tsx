import React, { useState } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { DropLocation } from "../../waves/drops/Drop";
import { useDropInteractionRules } from "../../../hooks/drops/useDropInteractionRules";
import MemesLeaderboardDropCard from "./MemesLeaderboardDropCard";
import MemesLeaderboardDropHeader from "./MemesLeaderboardDropHeader";
import MemesLeaderboardDropDescription from "./MemesLeaderboardDropDescription";
import MemesLeaderboardDropVoteSummary from "./MemesLeaderboardDropVoteSummary";
import MemesLeaderboardDropArtistInfo from "./MemesLeaderboardDropArtistInfo";

import MemeDropTraits from "./MemeDropTraits";
import DropListItemContentMedia from "../../drops/view/item/content/media/DropListItemContentMedia";
import WaveDropActionsOptions from "../../waves/drops/WaveDropActionsOptions";
import WaveDropActionsOpen from "../../waves/drops/WaveDropActionsOpen";
import { VotingModal, MobileVotingModal } from "../../voting";
import VotingModalButton from "../../voting/VotingModalButton";
import useIsMobileScreen from "../../../hooks/isMobileScreen";

interface MemesLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly location?: DropLocation;
}

export const MemesLeaderboardDrop: React.FC<MemesLeaderboardDropProps> = ({
  drop,
  onDropClick,
  location = DropLocation.WAVE,
}) => {
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const { canDelete } = useDropInteractionRules(drop);
  const isMobile = useIsMobileScreen();

  // Extract metadata
  const title =
    drop.metadata?.find((m) => m.data_key === "title")?.data_value ??
    "Artwork Title";
  const description =
    drop.metadata?.find((m) => m.data_key === "description")?.data_value ??
    "This is an artwork submission for The Memes collection.";

  // Get artwork media URL if available
  const artworkMedia = drop.parts.at(0)?.media.at(0);

  // Get top voters for votes display
  const firstThreeVoters = drop.top_raters?.slice(0, 3) ?? [];

  return (
    <div
      className="tw-w-full tw-cursor-pointer tw-@container"
      onClick={() => onDropClick(drop)}
    >
      <div className="tw-w-full tw-group">
        <MemesLeaderboardDropCard drop={drop}>
          <div>
            <div className="tw-p-4">
              <div className="tw-flex tw-flex-col tw-gap-y-1">
                <div className="tw-flex tw-items-center tw-justify-between">
                  <MemesLeaderboardDropArtistInfo drop={drop} />
                  <div className="tw-flex tw-items-center">
                    <div className="tw-h-8 tw-hidden lg:tw-block">
                      <WaveDropActionsOpen drop={drop} />
                    </div>
                    <div className="tw-h-8 tw-hidden lg:tw-block">
                      {canDelete && <WaveDropActionsOptions drop={drop} />}
                    </div>
                  </div>
                </div>
                <div className="tw-mt-1 sm:tw-mt-0 sm:tw-ml-[3.25rem]">
                  <MemesLeaderboardDropHeader title={title} />
                  <MemesLeaderboardDropDescription description={description} />
                </div>
              </div>
            </div>

            {artworkMedia && (
              <div
                className={`tw-flex tw-justify-center tw-h-96 ${
                  location === DropLocation.WAVE
                    ? "tw-bg-iron-800/30"
                    : "tw-bg-iron-900/40"
                }`}
              >
                <DropListItemContentMedia
                  media_mime_type={artworkMedia.mime_type}
                  media_url={artworkMedia.url}
                />
              </div>
            )}
            <div className="tw-p-4">
              <MemeDropTraits drop={drop} />
            </div>
            <div className="tw-flex tw-flex-col tw-gap-y-2 @[700px]:tw-flex-row tw-justify-between @[700px]:tw-pb-4 @[700px]:tw-px-4 @[700px]:tw-items-center">
              <div className="tw-px-6 @[700px]:tw-px-0">
                <MemesLeaderboardDropVoteSummary
                  current={drop.rating}
                  projected={drop.rating_prediction}
                  creditType={drop.wave.voting_credit_type}
                  ratersCount={drop.raters_count}
                  topVoters={firstThreeVoters}
                />
              </div>

              <div 
                className="tw-pt-4 tw-pb-4 tw-px-6 tw-flex tw-justify-center @[700px]:tw-pt-0 @[700px]:tw-pb-0 @[700px]:tw-px-0 tw-w-full @[700px]:tw-w-auto tw-border-t tw-border-solid tw-border-iron-800 @[700px]:tw-border-none tw-border-x-0 tw-border-b-0"
                onClick={(e) => e.stopPropagation()}
              >
                <VotingModalButton
                  drop={drop}
                  onClick={() => setIsVotingModalOpen(true)}
                />
              </div>
            </div>
          </div>

          {isMobile ? (
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

          {/* Actions component (desktop only) - Moved outside the card to work with hover */}
        </MemesLeaderboardDropCard>
      </div>
    </div>
  );
};

export default MemesLeaderboardDrop;
