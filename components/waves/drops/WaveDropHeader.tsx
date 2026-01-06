"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import WaveDropTime from "./time/WaveDropTime";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { ArtistSubmissionBadge } from "./ArtistSubmissionBadge";
import { ArtistPreviewModal } from "./ArtistPreviewModal";
import { ProfileWinnerBadge } from "./ProfileWinnerBadge";
import { useMemo, useCallback } from "react";
import { useArtistPreviewModal } from "@/hooks/useArtistPreviewModal";
import { useCompactMode } from "@/contexts/CompactModeContext";

interface WaveDropHeaderProps {
  readonly drop: ApiDrop;
  readonly isStorm: boolean;
  readonly currentPartIndex: number;
  readonly partsCount: number;
  readonly showWaveInfo: boolean;
  readonly badge?: React.ReactNode | undefined;
}

const WaveDropHeader: React.FC<WaveDropHeaderProps> = ({
  drop,
  isStorm,
  currentPartIndex,
  partsCount,
  showWaveInfo,
  badge,
}) => {
  const router = useRouter();
  const compact = useCompactMode();
  const { isModalOpen, modalInitialTab, handleBadgeClick, handleModalClose } =
    useArtistPreviewModal();

  const submissionCount = useMemo(() =>
    drop.author.active_main_stage_submission_ids?.length || 0,
    [drop.author.active_main_stage_submission_ids]
  );

  const hasSubmissions = submissionCount > 0;

  // Check if this drop author has any main stage winner drop IDs
  const winnerCount = useMemo(() =>
    drop.author.winner_main_stage_drop_ids?.length || 0,
    [drop.author.winner_main_stage_drop_ids]
  );

  const isWinner = winnerCount > 0;

  // Memoize event handlers to prevent unnecessary re-renders
  const handleNavigation = useCallback((e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(path);
  }, [router]);

  return (
    <>
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-2">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <p className={`tw-mb-0 tw-leading-none tw-font-semibold ${compact ? "tw-text-sm" : "tw-text-md"}`}>
              <UserProfileTooltipWrapper
                user={drop.author.handle ?? drop.author.id}
              >
                <Link
                  onClick={(e) => handleNavigation(e, `/${drop.author.handle}`)}
                  href={`/${drop.author.handle}`}
                  className="tw-no-underline desktop-hover:hover:tw-underline tw-text-iron-200 desktop-hover:hover:tw-text-opacity-80 tw-transition tw-duration-300 tw-ease-out"
                >
                  {drop.author.handle}
                </Link>
              </UserProfileTooltipWrapper>
            </p>
            <UserCICAndLevel
              level={drop.author.level}
              size={UserCICAndLevelSize.SMALL}
            />
            {hasSubmissions && (
              <ArtistSubmissionBadge
                submissionCount={submissionCount}
                onBadgeClick={() => handleBadgeClick("active")}
                tooltipId={`header-badge-${drop.id}`}
              />
            )}
            {isWinner && (
              <ProfileWinnerBadge
                winCount={winnerCount}
                onBadgeClick={() => handleBadgeClick("winners")}
                tooltipId={`winner-badge-${drop.id}`}
              />
            )}
            <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
            <WaveDropTime timestamp={drop.created_at} />
          </div>
          {badge && <div className="tw-ml-2">{badge}</div>}
        </div>
      </div>
      <div>
        {showWaveInfo && drop.wave && (
          (() => {
            const waveMeta = (drop.wave as unknown as {
              chat?: { scope?: { group?: { is_direct_message?: boolean | undefined } | undefined } | undefined } | undefined;
            })?.chat;
            const waveHref = getWaveRoute({
              waveId: drop.wave.id,
              isDirectMessage: waveMeta?.scope?.group?.is_direct_message ?? false,
              isApp: false,
            });
            return (
              <Link
                onClick={(e) => handleNavigation(e, waveHref)}
                href={waveHref}
                className="tw-mb-0 tw-text-[11px] tw-leading-0 -tw-mt-1 tw-text-iron-500 hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out tw-no-underline"
              >
                {drop.wave.name}
              </Link>
            );
          })()
        )}
      </div>

      {isStorm && (
        <div className="tw-inline-flex tw-relative tw-mt-2">
          <span className="tw-text-xs tw-text-iron-50 tw-mb-1.5">
            {currentPartIndex + 1} /{" "}
            <span className="tw-text-iron-400">{partsCount}</span>
          </span>
        </div>
      )}

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

export default WaveDropHeader;
