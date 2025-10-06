"use client"

import React, { useState } from "react";
import Link from "next/link";
import { cicToType } from "@/helpers/Helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import WaveDropAuthorPfp from "@/components/waves/drops/WaveDropAuthorPfp";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import WaveDropTime from "@/components/waves/drops/time/WaveDropTime";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { ArtistSubmissionBadge } from "@/components/waves/drops/ArtistSubmissionBadge";
import { ArtistPreviewModal } from "@/components/waves/drops/ArtistPreviewModal";
import { ProfileWinnerBadge } from "@/components/waves/drops/ProfileWinnerBadge";

interface MemeDropArtistInfoProps {
  readonly drop: ExtendedDrop;
}

export default function MemeDropArtistInfo({ drop }: MemeDropArtistInfoProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const submissionCount = drop.author.active_main_stage_submission_ids?.length || 0;
  const hasSubmissions = submissionCount > 0;

  // Check if this drop author has any main stage winner drop IDs
  const isWinner = drop.author.winner_main_stage_drop_ids && 
                   drop.author.winner_main_stage_drop_ids.length > 0;

  const handleSubmissionBadgeClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="tw-flex tw-items-center tw-gap-x-3">
      <WaveDropAuthorPfp drop={drop} />
      <div className="tw-flex tw-flex-col tw-gap-y-1.5">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          {!!drop.author?.level && (
            <UserCICAndLevel
              level={drop.author.level}
              cicType={cicToType(drop.author.cic)}
              size={UserCICAndLevelSize.SMALL}
            />
          )}
          <Link
            href={`/${drop.author?.handle}`}
            onClick={(e) => e.stopPropagation()}
            className="tw-no-underline"
          >
            {drop.author?.handle ? (
              <UserProfileTooltipWrapper user={drop.author.handle ?? drop.author.id}>
                <span className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
                  {drop.author?.handle}
                </span>
              </UserProfileTooltipWrapper>
            ) : (
              <span className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
                {drop.author?.handle}
              </span>
            )}
          </Link>
          {isWinner && (
            <ProfileWinnerBadge 
              winCount={1}
            />
          )}
          {hasSubmissions && (
            <ArtistSubmissionBadge
              submissionCount={submissionCount}
              onBadgeClick={handleSubmissionBadgeClick}
              tooltipId={`meme-badge-${drop.id}`}
            />
          )}
          <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
          <WaveDropTime timestamp={drop.created_at} />
          <div className="tw-ml-2">
            <WinnerDropBadge
              rank={drop.rank}
              decisionTime={drop.winning_context?.decision_time ?? null}
            />
          </div>
        </div>
        {drop.wave && (
          <Link
            onClick={(e) => e.stopPropagation()}
            href={`/my-stream?wave=${drop.wave.id}`}
            className="tw-mb-0 tw-text-[11px] tw-leading-0 tw-text-iron-500 hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out tw-no-underline"
          >
            {drop.wave.name}
          </Link>
        )}
      </div>
      
      {/* Artist Submission Preview Modal */}
      <ArtistPreviewModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        user={drop.author}
      />
    </div>
  );
}
