"use client"

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
import { useArtistPreviewModal } from "@/hooks/useArtistPreviewModal";

interface MemesLeaderboardDropArtistInfoProps {
  readonly drop: ExtendedDrop;
}

const MemesLeaderboardDropArtistInfo = ({
  drop
}: MemesLeaderboardDropArtistInfoProps) => {
  const { isModalOpen, modalInitialTab, handleBadgeClick, handleModalClose } =
    useArtistPreviewModal();

  const submissionCount = drop.author.active_main_stage_submission_ids?.length || 0;
  const hasSubmissions = submissionCount > 0;

  const winnerCount = drop.author.winner_main_stage_drop_ids?.length || 0;
  const isWinner = winnerCount > 0;

  return (
    <div className="tw-flex tw-gap-x-3">
      <WaveDropAuthorPfp drop={drop} />
      <div className="tw-flex tw-flex-col tw-justify-between tw-h-12">
        {/* Top row: Handle + Artist badge + Timestamp */}
        <div className="tw-flex tw-items-center tw-gap-x-2 tw-flex-wrap -tw-mt-0.5">
          {!!drop.author?.level && (
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
                {drop.author?.handle}
              </span>
            </Link>
          )}

          {isWinner && (
            <ProfileWinnerBadge
              winCount={winnerCount}
              onBadgeClick={() => handleBadgeClick("winners")}
              tooltipId={`leaderboard-winner-badge-${drop.id}`}
            />
          )}
          {hasSubmissions && (
            <ArtistSubmissionBadge
              submissionCount={submissionCount}
              onBadgeClick={() => handleBadgeClick("active")}
              tooltipId={`leaderboard-badge-${drop.id}`}
            />
          )}

          <span className="tw-text-sm tw-text-iron-500">•</span>

          <WaveDropTime
            timestamp={drop.created_at}
          />
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
