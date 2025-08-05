import React, { useState } from "react";
import Link from "next/link";
import { cicToType } from "../../../helpers/Helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../user/utils/UserCICAndLevel";
import WaveDropAuthorPfp from "../../waves/drops/WaveDropAuthorPfp";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import WinnerDropBadge from "../../waves/drops/winner/WinnerDropBadge";
import WaveDropTime from "../../waves/drops/time/WaveDropTime";
import UserProfileTooltipWrapper from "../../utils/tooltip/UserProfileTooltipWrapper";
import { ArtistSubmissionBadge } from "../../waves/drops/ArtistSubmissionBadge";
import { ArtistSubmissionPreviewModal } from "../../waves/drops/ArtistSubmissionPreviewModal";

interface MemesLeaderboardDropArtistInfoProps {
  readonly drop: ExtendedDrop;
}

const MemesLeaderboardDropArtistInfo: React.FC<
  MemesLeaderboardDropArtistInfoProps
> = ({ drop }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const submissionCount = drop.author.active_main_stage_submission_ids?.length || 0;
  const hasSubmissions = submissionCount > 0;

  const handleSubmissionBadgeClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="tw-flex tw-items-center tw-gap-x-3">
      <WaveDropAuthorPfp drop={drop} />
      <div className="tw-flex tw-items-center tw-gap-x-3">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          {drop.author?.level && (
            <UserCICAndLevel
              level={drop.author.level}
              cicType={cicToType(drop.author.cic)}
              size={UserCICAndLevelSize.SMALL}
            />
          )}
          {drop.author?.handle ? (
            <UserProfileTooltipWrapper user={drop.author.handle ?? drop.author.id}>
              <Link
                href={`/${drop.author?.handle}`}
                onClick={(e) => e.stopPropagation()}
                className="tw-no-underline desktop-hover:hover:tw-underline"
              >
                <span className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
                  {drop.author?.handle}
                </span>
              </Link>
            </UserProfileTooltipWrapper>
          ) : (
            <Link
              href={`/${drop.author?.handle}`}
              onClick={(e) => e.stopPropagation()}
              className="tw-no-underline desktop-hover:hover:tw-underline"
            >
              <span className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
                {drop.author?.handle}
              </span>
            </Link>
          )}
          {hasSubmissions && (
            <ArtistSubmissionBadge
              submissionCount={submissionCount}
              onBadgeClick={handleSubmissionBadgeClick}
              tooltipId={`leaderboard-badge-${drop.id}`}
            />
          )}

          {/* Divider followed by WaveDropTime component */}
          <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
          <WaveDropTime 
            timestamp={drop.created_at}
          />
        </div>
        <WinnerDropBadge
          rank={drop.rank}
          decisionTime={drop.winning_context?.decision_time || null}
        />
      </div>
      
      {/* Artist Submission Preview Modal */}
      <ArtistSubmissionPreviewModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        user={drop.author}
      />
    </div>
  );
};

export default MemesLeaderboardDropArtistInfo;
