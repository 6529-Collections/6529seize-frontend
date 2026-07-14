"use client";

import React from "react";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import {
  getSubmissionCount,
  getTrophyArtworkCount,
} from "@/helpers/artist-activity.helpers";
import {
  useArtistPreviewModal,
  type ArtistPreviewTab,
} from "@/hooks/useArtistPreviewModal";
import { closeAllCustomTooltips } from "@/helpers/tooltip.helpers";
import { ArtistActivityBadge } from "./ArtistActivityBadge";
import { ArtistPreviewModal } from "./ArtistPreviewModal";
import { CurationWaveBadge } from "./CurationWaveBadge";
import type { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { getProfileWaveIdentity } from "@/hooks/useProfileWave";
import { useRouter } from "next/navigation";
import {
  WaveCompetitionBadges,
  type WaveCompetitionPreviewTab,
} from "./WaveCompetitionBadges";
import { WaveCompetitionPreviewModal } from "./WaveCompetitionPreviewModal";

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
  readonly profile_wave_id?: string | null;
  readonly profile_wave_name?: string | null;
  readonly profile_wave_pfp?: string | null;
  readonly is_wave_creator?: boolean | null;
  readonly badges?: {
    readonly artist_of_main_stage_submissions?: number | null;
    readonly artist_of_memes?: number | null;
    readonly profile_wave_id?: string | null;
    readonly profile_wave_name?: string | null;
    readonly profile_wave_pfp?: string | null;
  } | null;
  readonly wave_participation?: {
    readonly is_participant: boolean;
    readonly is_winner: boolean;
  } | null;
  readonly classification: ApiProfileClassification;
  readonly sub_classification: string | null;
}

type ApiProfileMinWithAuthorBadges = ApiProfileMin & {
  readonly badges?: DropAuthorBadgesProfile["badges"];
};

interface DropAuthorBadgesProps {
  readonly profile: DropAuthorBadgesProfile;
  readonly tooltipIdPrefix?: string | undefined;
  readonly className?: string | undefined;
  readonly size?: "default" | "compact" | undefined;
  readonly showProfileWaveBadge?: boolean | undefined;
  readonly wave?: ApiWaveMin | undefined;
  readonly onArtistPreviewOpen?:
    | ((params: {
        readonly user: ApiProfileMin;
        readonly initialTab: ArtistPreviewTab;
      }) => void)
    | undefined;
}

const DEFAULT_CONTAINER_CLASS = "tw-inline-flex tw-items-center tw-gap-x-1.5";

const getTrimmedText = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
};

const getProfileWaveId = (profile: DropAuthorBadgesProfile): string | null =>
  getTrimmedText(profile.profile_wave_id) ??
  getTrimmedText(profile.badges?.profile_wave_id);

const getProfileWaveName = (profile: DropAuthorBadgesProfile): string | null =>
  getTrimmedText(profile.profile_wave_name) ??
  getTrimmedText(profile.badges?.profile_wave_name);

const getProfileWavePfp = (profile: DropAuthorBadgesProfile): string | null =>
  getTrimmedText(profile.profile_wave_pfp) ??
  getTrimmedText(profile.badges?.profile_wave_pfp);

const copyArray = <T,>(value?: readonly T[] | null): T[] =>
  value !== null && value !== undefined ? [...value] : [];

const toApiProfileMin = (
  profile: DropAuthorBadgesProfile
): ApiProfileMinWithAuthorBadges => {
  const primaryAddress =
    profile.primary_address ?? profile.primary_wallet ?? "";
  const fallbackId = primaryAddress;
  const profileWaveId = getProfileWaveId(profile);

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
    active_main_stage_submission_ids: copyArray(
      profile.active_main_stage_submission_ids
    ),
    winner_main_stage_drop_ids: copyArray(profile.winner_main_stage_drop_ids),
    artist_of_prevote_cards: copyArray(profile.artist_of_prevote_cards),
    profile_wave_id: profileWaveId,
    is_wave_creator: profile.is_wave_creator === true,
    classification: profile.classification,
    sub_classification: profile.sub_classification,
    badges: profile.badges,
  };
};

export const DropAuthorBadges: React.FC<DropAuthorBadgesProps> = ({
  profile,
  tooltipIdPrefix = "author-badges",
  className = DEFAULT_CONTAINER_CLASS,
  size = "default",
  showProfileWaveBadge = true,
  wave,
  onArtistPreviewOpen,
}) => {
  const router = useRouter();
  const seizeSettings = useSeizeSettingsOptional();
  const profileWaveId = getProfileWaveId(profile);
  const submissionCount = getSubmissionCount(profile);
  const trophyCount = getTrophyArtworkCount(profile);
  const hasActivityBadge = submissionCount > 0 || trophyCount > 0;
  const profileWaveName = getProfileWaveName(profile);
  const profileWavePfp = getProfileWavePfp(profile);
  const hasProfileWaveBadge = showProfileWaveBadge && profileWaveId !== null;
  const profileWaveIdentity = getProfileWaveIdentity(profile);
  const waveParticipation = wave ? profile.wave_participation : null;
  const isWaveParticipant = waveParticipation?.is_participant === true;
  const isWaveWinner = waveParticipation?.is_winner === true;
  const isMainStageWave = wave
    ? (seizeSettings?.isMemesWave(wave.id) ?? false)
    : false;
  const hasWaveCompetitionBadge =
    !!wave && !isMainStageWave && (isWaveParticipant || isWaveWinner);

  const modalUser = React.useMemo(() => toApiProfileMin(profile), [profile]);
  const [isWaveCompetitionPreviewOpen, setIsWaveCompetitionPreviewOpen] =
    React.useState(false);
  const [waveCompetitionTab, setWaveCompetitionTab] =
    React.useState<WaveCompetitionPreviewTab>("active");

  const {
    isModalOpen: isArtistPreviewOpen,
    activeTab,
    handleBadgeClick: handleArtistBadgeClick,
    handleTabChange: handleArtistTabChange,
    handleModalClose: handleArtistModalClose,
  } = useArtistPreviewModal();

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

  const onProfileWaveBadgeClick = React.useCallback(() => {
    closeAllCustomTooltips();
    if (!profileWaveId) {
      return;
    }
    router.push(
      getWaveRoute({
        waveId: profileWaveId,
        isDirectMessage: false,
        isApp: false,
      })
    );
  }, [profileWaveId, router]);

  const onWaveCompetitionBadgeClick = React.useCallback(
    (tab: WaveCompetitionPreviewTab) => {
      closeAllCustomTooltips();
      setWaveCompetitionTab(tab);
      setIsWaveCompetitionPreviewOpen(true);
    },
    []
  );

  const onWaveCompetitionPreviewClose = React.useCallback(() => {
    setIsWaveCompetitionPreviewOpen(false);
  }, []);

  if (!hasActivityBadge && !hasProfileWaveBadge && !hasWaveCompetitionBadge) {
    return null;
  }

  return (
    <>
      <div className={className}>
        {hasWaveCompetitionBadge && wave && (
          <WaveCompetitionBadges
            isParticipant={isWaveParticipant}
            isWinner={isWaveWinner}
            waveName={wave.name}
            onBadgeClick={onWaveCompetitionBadgeClick}
            tooltipIdPrefix={`${tooltipIdPrefix}-competition`}
          />
        )}
        {hasActivityBadge && (
          <ArtistActivityBadge
            submissionCount={submissionCount}
            trophyCount={trophyCount}
            onBadgeClick={onArtistBadgeClick}
            tooltipId={`${tooltipIdPrefix}-activity`}
            size={size}
          />
        )}
        {hasProfileWaveBadge && (
          <CurationWaveBadge
            waveId={profileWaveId}
            tooltipId={`${tooltipIdPrefix}-profile-wave`}
            onBadgeClick={onProfileWaveBadgeClick}
            size={size}
            profileIdentity={profileWaveIdentity}
            waveName={profileWaveName}
            wavePfp={profileWavePfp}
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

      {hasWaveCompetitionBadge && wave && (
        <WaveCompetitionPreviewModal
          isOpen={isWaveCompetitionPreviewOpen}
          onClose={onWaveCompetitionPreviewClose}
          user={modalUser}
          wave={wave}
          hasActiveEntries={isWaveParticipant}
          hasWinningEntries={isWaveWinner}
          activeTab={waveCompetitionTab}
          onTabChange={setWaveCompetitionTab}
        />
      )}
    </>
  );
};
