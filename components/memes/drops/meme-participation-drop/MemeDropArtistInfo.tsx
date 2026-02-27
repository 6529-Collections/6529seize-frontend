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
import { getWaveRoute } from "@/helpers/navigation.helpers";
import {
  getSubmissionCount,
  getTrophyArtworkCount,
} from "@/helpers/artist-activity.helpers";

interface MemeDropArtistInfoProps {
  readonly drop: ExtendedDrop;
}

export default function MemeDropArtistInfo({ drop }: MemeDropArtistInfoProps) {
  const { isModalOpen, modalInitialTab, handleBadgeClick, handleModalClose } =
    useArtistPreviewModal();

  const submissionCount = getSubmissionCount(drop.author);
  const hasSubmissions = submissionCount > 0;

  const trophyCount = getTrophyArtworkCount(drop.author);
  const hasTrophyArtworks = trophyCount > 0;
  const hasActivityBadge = hasSubmissions || hasTrophyArtworks;

  return (
    <div className="tw-flex tw-items-center tw-gap-x-3">
      <WaveDropAuthorPfp drop={drop} />
      <div className="tw-flex tw-flex-col tw-gap-y-1.5">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          {!!drop.author?.level && (
            <UserCICAndLevel
              level={drop.author.level}
              size={UserCICAndLevelSize.SMALL}
            />
          )}
          <Link
            href={`/${drop.author?.handle}`}
            onClick={(e) => e.stopPropagation()}
            className="tw-no-underline"
          >
            {drop.author?.handle ? (
              <UserProfileTooltipWrapper
                user={drop.author.handle ?? drop.author.id}
              >
                <span className="tw-mb-0 tw-text-md tw-font-semibold tw-leading-none">
                  {drop.author?.handle}
                </span>
              </UserProfileTooltipWrapper>
            ) : (
              <span className="tw-mb-0 tw-text-md tw-font-semibold tw-leading-none">
                {drop.author?.handle}
              </span>
            )}
          </Link>
          {hasActivityBadge && (
            <ArtistActivityBadge
              submissionCount={submissionCount}
              trophyCount={trophyCount}
              onBadgeClick={handleBadgeClick}
              tooltipId={`meme-activity-badge-${drop.id}`}
            />
          )}
          <div className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-600"></div>
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
            href={getWaveRoute({
              waveId: drop.wave.id,
              isDirectMessage: false,
              isApp: false,
            })}
            className="tw-leading-0 tw-mb-0 tw-text-[11px] tw-text-iron-500 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-300"
          >
            {drop.wave.name}
          </Link>
        )}
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
}
