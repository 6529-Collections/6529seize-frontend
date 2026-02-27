"use client";

import Link from "next/link";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import WaveDropAuthorPfp from "@/components/waves/drops/WaveDropAuthorPfp";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import WaveDropTime from "@/components/waves/drops/time/WaveDropTime";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { ArtistPreviewModal } from "@/components/waves/drops/ArtistPreviewModal";
import { ArtistActivityBadge } from "@/components/waves/drops/ArtistActivityBadge";
import { useArtistPreviewModal } from "@/hooks/useArtistPreviewModal";
import {
  getSubmissionCount,
  getTrophyArtworkCount,
} from "@/helpers/artist-activity.helpers";

interface MemesLeaderboardDropArtistInfoProps {
  readonly drop: ExtendedDrop;
}

const MemesLeaderboardDropArtistInfo = ({
  drop,
}: MemesLeaderboardDropArtistInfoProps) => {
  const { isModalOpen, modalInitialTab, handleBadgeClick, handleModalClose } =
    useArtistPreviewModal();

  const submissionCount = getSubmissionCount(drop.author);
  const hasSubmissions = submissionCount > 0;

  const trophyCount = getTrophyArtworkCount(drop.author);
  const hasTrophyArtworks = trophyCount > 0;
  const hasActivityBadge = hasSubmissions || hasTrophyArtworks;

  return (
    <div className="tw-flex tw-gap-x-3">
      <WaveDropAuthorPfp drop={drop} />
      <div className="tw-flex tw-h-12 tw-flex-col tw-justify-between">
        <div className="-tw-mt-0.5 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2">
          {drop.author?.handle ? (
            <UserProfileTooltipWrapper user={drop.author.handle}>
              <Link
                href={`/${drop.author?.handle}`}
                onClick={(e) => e.stopPropagation()}
                className="tw-no-underline desktop-hover:hover:tw-underline"
              >
                <span className="tw-text-sm tw-font-bold tw-text-white">
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
              <span className="tw-text-sm tw-font-bold tw-text-white">
                {drop.author.handle}
              </span>
            </Link>
          )}

          {!!drop.author?.level && (
            <UserCICAndLevel
              level={drop.author.level}
              size={UserCICAndLevelSize.SMALL}
            />
          )}

          {hasActivityBadge && (
            <ArtistActivityBadge
              submissionCount={submissionCount}
              trophyCount={trophyCount}
              onBadgeClick={handleBadgeClick}
              tooltipId={`leaderboard-activity-badge-${drop.id}`}
            />
          )}

          <span className="tw-text-sm tw-text-iron-500">•</span>

          <WaveDropTime timestamp={drop.created_at} />
        </div>

        {/* Bottom row: Winner badge */}
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <WinnerDropBadge
            rank={drop.rank}
            decisionTime={drop.winning_context?.decision_time || null}
          />
        </div>
      </div>

      {/* Artist Preview Modal */}
      <ArtistPreviewModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        user={drop.author}
        initialTab={modalInitialTab}
      />
    </div>
  );
};

export default MemesLeaderboardDropArtistInfo;
