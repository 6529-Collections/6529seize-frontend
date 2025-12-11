"use client";

import React, { useState } from "react";
import { ApiDrop } from "@/generated/models/ObjectSerializer";
import Link from "next/link";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import { cicToType } from "@/helpers/Helpers";
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
  const [modalInitialTab, setModalInitialTab] = useState<"active" | "winners">("active");

  const submissionCount = drop.author.active_main_stage_submission_ids?.length || 0;
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
      <div className="tw-flex tw-items-center tw-gap-x-3">
        <Link
          href={`/${drop.author.handle}`}
          className="tw-flex tw-items-center tw-gap-x-3 tw-no-underline desktop-hover:hover:tw-underline"
        >
          {drop.author.pfp ? (
            <img
              className="tw-size-10 tw-rounded-md tw-ring-1 tw-ring-inset tw-ring-white/10 tw-object-contain tw-bg-iron-900"
              src={drop.author.pfp}
              alt="User avatar"
            />
          ) : (
            <div className="tw-size-10 tw-rounded-md tw-ring-1 tw-ring-inset tw-ring-white/10 tw-bg-iron-800" />
          )}
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <UserCICAndLevel
              level={drop.author.level}
              cicType={cicToType(drop.author.cic)}
              size={UserCICAndLevelSize.SMALL}
            />

            <UserProfileTooltipWrapper user={drop.author.handle ?? drop.author.id}>
              <span className="tw-text-md tw-font-medium tw-text-iron-200 desktop-hover:hover:tw-text-opacity-80">
                {drop.author.handle}
              </span>
            </UserProfileTooltipWrapper>
          </div>
        </Link>
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

      {/* Artist Preview Modal */}
      <ArtistPreviewModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        user={drop.author}
        initialTab={modalInitialTab}
      />
    </>
  );
};
