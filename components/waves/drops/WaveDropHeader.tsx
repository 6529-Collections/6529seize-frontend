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
import { ArtistPreviewModal } from "./ArtistPreviewModal";
import { ArtistActivityBadge } from "./ArtistActivityBadge";
import { WaveCreatorBadge } from "./WaveCreatorBadge";
import { WaveCreatorPreviewModal } from "./WaveCreatorPreviewModal";
import { useMemo, useCallback } from "react";
import { useArtistPreviewModal } from "@/hooks/useArtistPreviewModal";
import { useWaveCreatorPreviewModal } from "@/hooks/useWaveCreatorPreviewModal";
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
  const {
    isModalOpen: isArtistPreviewOpen,
    modalInitialTab,
    handleBadgeClick: handleArtistBadgeClick,
    handleModalClose: handleArtistModalClose,
  } = useArtistPreviewModal();
  const {
    isModalOpen: isWaveCreatorPreviewOpen,
    handleBadgeClick: handleWaveCreatorBadgeClick,
    handleModalClose: handleWaveCreatorModalClose,
  } = useWaveCreatorPreviewModal();

  const submissionCount = useMemo(
    () => drop.author.active_main_stage_submission_ids.length || 0,
    [drop.author.active_main_stage_submission_ids]
  );

  const hasSubmissions = submissionCount > 0;

  // Check if this drop author has any main stage winner drop IDs
  const winnerCount = useMemo(
    () => drop.author.winner_main_stage_drop_ids.length || 0,
    [drop.author.winner_main_stage_drop_ids]
  );

  const isWinner = winnerCount > 0;
  const hasActivityBadge = hasSubmissions || isWinner;

  const isWaveCreator = drop.author.is_wave_creator;

  // Memoize event handlers to prevent unnecessary re-renders
  const handleNavigation = useCallback(
    (e: React.MouseEvent, path: string) => {
      e.preventDefault();
      e.stopPropagation();
      router.push(path);
    },
    [router]
  );

  return (
    <>
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-2">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <p
              className={`tw-mb-0 tw-font-semibold tw-leading-none ${compact ? "tw-text-sm" : "tw-text-md"}`}
            >
              <UserProfileTooltipWrapper
                user={drop.author.handle ?? drop.author.id}
              >
                <Link
                  onClick={(e) =>
                    handleNavigation(
                      e,
                      `/${drop.author.handle ?? drop.author.primary_address}`
                    )
                  }
                  href={`/${drop.author.handle ?? drop.author.primary_address}`}
                  className="tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-opacity-80 desktop-hover:hover:tw-underline"
                >
                  {drop.author.handle}
                </Link>
              </UserProfileTooltipWrapper>
            </p>
            <UserCICAndLevel
              level={drop.author.level}
              size={UserCICAndLevelSize.SMALL}
            />
            {hasActivityBadge && (
              <ArtistActivityBadge
                submissionCount={submissionCount}
                winCount={winnerCount}
                onBadgeClick={handleArtistBadgeClick}
                tooltipId={`header-activity-badge-${drop.id}`}
              />
            )}
            {isWaveCreator && (
              <WaveCreatorBadge
                tooltipId={`wave-creator-${drop.id}`}
                onBadgeClick={handleWaveCreatorBadgeClick}
              />
            )}
            <div className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-600"></div>
            <WaveDropTime timestamp={drop.created_at} />
          </div>
          {!!badge && <div className="tw-ml-2">{badge}</div>}
        </div>
      </div>
      <div>
        {showWaveInfo &&
          (() => {
            const waveMeta = (
              drop.wave as unknown as {
                chat?:
                  | {
                      scope?:
                        | {
                            group?:
                              | { is_direct_message?: boolean | undefined }
                              | undefined;
                          }
                        | undefined;
                    }
                  | undefined;
              }
            ).chat;
            const waveHref = getWaveRoute({
              waveId: drop.wave.id,
              isDirectMessage:
                waveMeta?.scope?.group?.is_direct_message ?? false,
              isApp: false,
            });
            return (
              <Link
                onClick={(e) => handleNavigation(e, waveHref)}
                href={waveHref}
                className="tw-leading-0 -tw-mt-1 tw-mb-0 tw-text-[11px] tw-text-iron-500 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-300"
              >
                {drop.wave.name}
              </Link>
            );
          })()}
      </div>

      {isStorm && (
        <div className="tw-relative tw-mt-2 tw-inline-flex">
          <span className="tw-mb-1.5 tw-text-xs tw-text-iron-50">
            {currentPartIndex + 1} /{" "}
            <span className="tw-text-iron-400">{partsCount}</span>
          </span>
        </div>
      )}

      {/* Artist Preview Modal */}
      <ArtistPreviewModal
        isOpen={isArtistPreviewOpen}
        onClose={handleArtistModalClose}
        user={drop.author}
        initialTab={modalInitialTab}
      />
      <WaveCreatorPreviewModal
        isOpen={isWaveCreatorPreviewOpen}
        onClose={handleWaveCreatorModalClose}
        user={drop.author}
      />
    </>
  );
};

export default WaveDropHeader;
