import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { useDropInteractionRules } from "../../../hooks/drops/useDropInteractionRules";
import MemesLeaderboardDropCard from "./MemesLeaderboardDropCard";
import MemesLeaderboardDropHeader from "./MemesLeaderboardDropHeader";
import MemesLeaderboardDropDescription from "./MemesLeaderboardDropDescription";
import MemesLeaderboardDropVoteSummary from "./MemesLeaderboardDropVoteSummary";
import MemesLeaderboardDropArtistInfo from "./MemesLeaderboardDropArtistInfo";
import MemesLeaderboardDropArtworkPreview from "./MemesLeaderboardDropArtworkPreview";
import MemesLeaderboardDropVotingSection from "./MemesLeaderboardDropVotingSection";

interface MemesLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const MemesLeaderboardDrop: React.FC<MemesLeaderboardDropProps> = ({
  drop,
  onDropClick,
}) => {
  const { canShowVote } = useDropInteractionRules(drop);

  const onViewLarger = () => {
    console.log("onViewLarger");
  };

  // Extract metadata
  const title =
    drop.metadata?.find((m) => m.data_key === "title")?.data_value || "Artwork Title";
  const description =
    drop.metadata?.find((m) => m.data_key === "description")?.data_value ||
    "This is an artwork submission for The Memes collection.";

  // Get artwork media URL if available
  const artworkMedia = drop.parts.at(0)?.media.at(0)?.url || null;

  // Get top voters for votes display
  const firstThreeVoters = drop.top_raters?.slice(0, 3) || [];

  return (
    <MemesLeaderboardDropCard drop={drop}>
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-12 tw-gap-5">
        {/* Left column - Metadata */}
        <div className="tw-col-span-1 md:tw-col-span-5 tw-p-5">
          {/* Header with metadata */}
          <div className="tw-flex tw-flex-col tw-gap-4">
            {/* Rank and title in the same row */}
            <MemesLeaderboardDropHeader
              title={title}
              rank={drop.rank}
              decisionTime={drop.winning_context?.decision_time || null}
            />

            {/* Description on its own row */}
            <MemesLeaderboardDropDescription description={description} />

            {/* Vote count and artist info on the last row */}
            <div className="tw-flex tw-flex-col tw-gap-4">
              {/* Vote count */}
              <MemesLeaderboardDropVoteSummary
                rating={drop.rating || 0}
                creditType={drop.wave.voting_credit_type}
                ratersCount={drop.raters_count || 0}
                topVoters={firstThreeVoters}
              />

              {/* Artist info with CIC and level */}
              <MemesLeaderboardDropArtistInfo drop={drop} />
            </div>
          </div>
        </div>

        {/* Right column - Artwork */}
        <MemesLeaderboardDropArtworkPreview
          artworkMedia={artworkMedia}
          title={title}
          onViewLarger={onViewLarger}
        />
      </div>

      {/* Voting section - spanning both columns */}
      <MemesLeaderboardDropVotingSection 
        drop={drop}
        canShowVote={canShowVote}
      />
    </MemesLeaderboardDropCard>
  );
};

export default MemesLeaderboardDrop;
