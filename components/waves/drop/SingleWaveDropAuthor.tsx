"use client";

import React, { useState } from "react";
import { ApiDrop } from "@/generated/models/ObjectSerializer";
import Link from "next/link";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { ArtistSubmissionBadge } from "@/components/waves/drops/ArtistSubmissionBadge";
import { ProfileWinnerBadge } from "@/components/waves/drops/ProfileWinnerBadge";
import { ArtistPreviewModal } from "@/components/waves/drops/ArtistPreviewModal";

interface SingleWaveDropAuthorProps {
  readonly drop: ApiDrop;
}

export const SingleWaveDropAuthor: React.FC<SingleWaveDropAuthorProps> = ({
  drop,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<"active" | "winners">(
    "active"
  );

  const submissionCount =
    drop.author.active_main_stage_submission_ids?.length || 0;
  const hasSubmissions = submissionCount > 0;

  const winnerCount = drop.author.winner_main_stage_drop_ids?.length || 0;
  const isWinner = winnerCount > 0;

  const handleBadgeClick = (tab: "active" | "winners") => {
    setModalInitialTab(tab);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="tw-flex tw-items-start tw-gap-x-2.5">
        <Link
          href={`/${drop.author.handle}`}
          className="tw-flex tw-items-center tw-gap-x-2.5 tw-no-underline"
        >
          {drop.author.pfp ? (
            <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-overflow-hidden">
              <img
                className="tw-size-full tw-object-contain tw-opacity-90"
                src={drop.author.pfp}
                alt="User avatar"
              />
            </div>
          ) : (
            <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900" />
          )}
          <div className="tw-inline-flex tw-items-center tw-gap-x-2">
            <div className="tw-inline-flex tw-items-center tw-gap-x-1">
              <UserProfileTooltipWrapper
                user={drop.author.handle ?? drop.author.id}
              >
                <span className="tw-text-md tw-font-semibold tw-text-white desktop-hover:hover:tw-text-opacity-80">
                  {drop.author.handle}
                </span>
              </UserProfileTooltipWrapper>
              <UserCICAndLevel
                level={drop.author.level}
                size={UserCICAndLevelSize.SMALL}
              />
            </div>
            <div className="tw-inline-flex tw-items-center tw-gap-x-1">
              {isWinner && (
                <ProfileWinnerBadge
                  winCount={winnerCount}
                  onBadgeClick={() => handleBadgeClick("winners")}
                  tooltipId={`single-drop-winner-badge-${drop.id}`}
                />
              )}
              {hasSubmissions && (
                <ArtistSubmissionBadge
                  submissionCount={submissionCount}
                  onBadgeClick={() => handleBadgeClick("active")}
                  tooltipId={`single-drop-badge-${drop.id}`}
                />
              )}
            </div>
          </div>
        </Link>
      </div>

      <ArtistPreviewModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        user={drop.author}
        initialTab={modalInitialTab}
      />
    </>
  );
};
