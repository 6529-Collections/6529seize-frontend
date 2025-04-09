import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { DropLocation } from "../../waves/drops/Drop";
import { useDropInteractionRules } from "../../../hooks/drops/useDropInteractionRules";
import MemesLeaderboardDropCard from "./MemesLeaderboardDropCard";
import MemesLeaderboardDropHeader from "./MemesLeaderboardDropHeader";
import MemesLeaderboardDropDescription from "./MemesLeaderboardDropDescription";
import MemesLeaderboardDropVoteSummary from "./MemesLeaderboardDropVoteSummary";
import MemesLeaderboardDropArtistInfo from "./MemesLeaderboardDropArtistInfo";

import MemesLeaderboardDropVotingSection from "./MemesLeaderboardDropVotingSection";
import MemeDropTraits from "./MemeDropTraits";
import DropListItemContentMedia from "../../drops/view/item/content/media/DropListItemContentMedia";
import WaveDropActionsOptions from "../../waves/drops/WaveDropActionsOptions";
import WaveDropActionsOpen from "../../waves/drops/WaveDropActionsOpen";

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
  const { canShowVote, canDelete } = useDropInteractionRules(drop);

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
      className="tw-w-full tw-cursor-pointer"
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
            <div className="tw-flex tw-flex-col tw-px-4 tw-pb-4">
              <MemesLeaderboardDropVoteSummary
                current={drop.rating}
                projected={drop.rating_prediction}
                creditType={drop.wave.voting_credit_type}
                ratersCount={drop.raters_count}
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
      </div>
    </div>
  );
};

export default MemesLeaderboardDrop;
