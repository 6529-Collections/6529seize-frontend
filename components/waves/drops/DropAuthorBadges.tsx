"use client";

import React from "react";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import {
  getSubmissionCount,
  getTrophyArtworkCount,
} from "@/helpers/artist-activity.helpers";
import {
  useArtistPreviewModal,
  type ArtistPreviewTab,
} from "@/hooks/useArtistPreviewModal";
import { useWaveCreatorPreviewModal } from "@/hooks/useWaveCreatorPreviewModal";
import { closeAllCustomTooltips } from "@/helpers/tooltip.helpers";
import { ArtistActivityBadge } from "./ArtistActivityBadge";
import { ArtistPreviewModal } from "./ArtistPreviewModal";
import { WaveCreatorBadge } from "./WaveCreatorBadge";
import { WaveCreatorPreviewModal } from "./WaveCreatorPreviewModal";

interface DropAuthorBadgesProfile {
  readonly id?: string | null;
  readonly handle?: string | null;
  readonly pfp?: string | null;
  readonly banner1_color?: string | null;
  readonly banner2_color?: string | null;
  readonly cic?: number;
  readonly rep?: number;
  readonly tdh?: number;
  readonly tdh_rate?: number;
  readonly xtdh?: number;
  readonly xtdh_rate?: number;
  readonly level?: number;
  readonly primary_address?: string | null;
  readonly primary_wallet?: string | null;
  readonly archived?: boolean;
  readonly active_main_stage_submission_ids?: readonly string[] | null;
  readonly winner_main_stage_drop_ids?: readonly string[] | null;
  readonly artist_of_prevote_cards?: readonly number[] | null;
  readonly is_wave_creator?: boolean | null;
}

interface DropAuthorBadgesProps {
  readonly profile: DropAuthorBadgesProfile;
  readonly tooltipIdPrefix?: string | undefined;
  readonly className?: string | undefined;
  readonly onArtistPreviewOpen?:
    | ((params: {
        readonly user: ApiProfileMin;
        readonly initialTab: ArtistPreviewTab;
      }) => void)
    | undefined;
  readonly onWaveCreatorPreviewOpen?:
    | ((user: ApiProfileMin) => void)
    | undefined;
}

const DEFAULT_CONTAINER_CLASS = "tw-inline-flex tw-items-center tw-gap-x-1";

const toApiProfileMin = (profile: DropAuthorBadgesProfile): ApiProfileMin => {
  const primaryAddress =
    profile.primary_address ?? profile.primary_wallet ?? "";
  const fallbackId = primaryAddress;

  return {
    id: profile.id ?? fallbackId,
    handle: profile.handle ?? null,
    pfp: profile.pfp ?? null,
    banner1_color: profile.banner1_color ?? null,
    banner2_color: profile.banner2_color ?? null,
    cic: profile.cic ?? 0,
    rep: profile.rep ?? 0,
    tdh: profile.tdh ?? 0,
    tdh_rate: profile.tdh_rate ?? 0,
    xtdh: profile.xtdh ?? 0,
    xtdh_rate: profile.xtdh_rate ?? 0,
    level: profile.level ?? 0,
    primary_address: primaryAddress,
    subscribed_actions: [],
    archived: profile.archived ?? false,
    active_main_stage_submission_ids:
      profile.active_main_stage_submission_ids !== null &&
      profile.active_main_stage_submission_ids !== undefined
        ? [...profile.active_main_stage_submission_ids]
        : [],
    winner_main_stage_drop_ids:
      profile.winner_main_stage_drop_ids !== null &&
      profile.winner_main_stage_drop_ids !== undefined
        ? [...profile.winner_main_stage_drop_ids]
        : [],
    artist_of_prevote_cards:
      profile.artist_of_prevote_cards !== null &&
      profile.artist_of_prevote_cards !== undefined
        ? [...profile.artist_of_prevote_cards]
        : [],
    is_wave_creator: profile.is_wave_creator === true,
  };
};

export const DropAuthorBadges: React.FC<DropAuthorBadgesProps> = ({
  profile,
  tooltipIdPrefix = "author-badges",
  className = DEFAULT_CONTAINER_CLASS,
  onArtistPreviewOpen,
  onWaveCreatorPreviewOpen,
}) => {
  const submissionCount = getSubmissionCount(profile);
  const trophyCount = getTrophyArtworkCount(profile);
  const hasActivityBadge = submissionCount > 0 || trophyCount > 0;
  const isWaveCreator = profile.is_wave_creator === true;

  const modalUser = React.useMemo(() => toApiProfileMin(profile), [profile]);

  const {
    isModalOpen: isArtistPreviewOpen,
    activeTab,
    handleBadgeClick: handleArtistBadgeClick,
    handleTabChange: handleArtistTabChange,
    handleModalClose: handleArtistModalClose,
  } = useArtistPreviewModal();

  const {
    isModalOpen: isWaveCreatorPreviewOpen,
    handleBadgeClick: handleWaveCreatorBadgeClick,
    handleModalClose: handleWaveCreatorModalClose,
  } = useWaveCreatorPreviewModal();

  const onArtistBadgeClick = React.useCallback(
    (tab: ArtistPreviewTab) => {
      closeAllCustomTooltips();
      if (onArtistPreviewOpen) {
        onArtistPreviewOpen({ user: modalUser, initialTab: tab });
        return;
      }
      handleArtistBadgeClick(tab);
    },
    [handleArtistBadgeClick, modalUser, onArtistPreviewOpen]
  );

  const onWaveCreatorBadgeClick = React.useCallback(() => {
    closeAllCustomTooltips();
    if (onWaveCreatorPreviewOpen) {
      onWaveCreatorPreviewOpen(modalUser);
      return;
    }
    handleWaveCreatorBadgeClick();
  }, [handleWaveCreatorBadgeClick, modalUser, onWaveCreatorPreviewOpen]);

  if (!hasActivityBadge && !isWaveCreator) {
    return null;
  }

  return (
    <>
      <div className={className}>
        {hasActivityBadge && (
          <ArtistActivityBadge
            submissionCount={submissionCount}
            trophyCount={trophyCount}
            onBadgeClick={onArtistBadgeClick}
            tooltipId={`${tooltipIdPrefix}-activity`}
          />
        )}
        {isWaveCreator && (
          <WaveCreatorBadge
            tooltipId={`${tooltipIdPrefix}-wave-creator`}
            onBadgeClick={onWaveCreatorBadgeClick}
          />
        )}
      </div>

      {hasActivityBadge && !onArtistPreviewOpen && (
        <ArtistPreviewModal
          isOpen={isArtistPreviewOpen}
          onClose={handleArtistModalClose}
          user={modalUser}
          activeTab={activeTab}
          onTabChange={handleArtistTabChange}
        />
      )}
      {isWaveCreator && !onWaveCreatorPreviewOpen && (
        <WaveCreatorPreviewModal
          isOpen={isWaveCreatorPreviewOpen}
          onClose={handleWaveCreatorModalClose}
          user={modalUser}
        />
      )}
    </>
  );
};
