"use client";

import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { isOwnProfileRoute } from "@/helpers/ProfileHelpers";
import { useIdentity } from "@/hooks/useIdentity";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useProfileWaveMutation } from "@/hooks/useProfileWaveMutation";
import { useWaveById } from "@/hooks/useWaveById";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import { useClickAway, useKeyPressEvent } from "react-use";
import UserPageProfileWaveContent from "./UserPageProfileWaveContent";
import UserPageProfileWavePicker from "./UserPageProfileWavePicker";
import {
  type ProfileIdentitySummary,
  useProfileMasonryContainerWidth,
} from "./UserPageProfileWaveMasonry";
import {
  getOfficialWaveMetadataLabel,
  getProfileIdentityKey,
  getWaveHref,
  isUnavailableWaveError,
  resolveProfileCuration,
} from "./userPageProfileWave.helpers";
import {
  InfoPanel,
  LoadingPanel,
  OfficialWaveSummary,
  RetryButton,
} from "./UserPageProfileWaveShared";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function UserPageProfileWave({
  profile: initialProfile,
}: {
  readonly profile: ApiIdentity;
}) {
  const params = useParams();
  const router = useRouter();
  const handleOrWallet = params["user"]?.toString() ?? "";
  const { containerRef, containerWidth } = useProfileMasonryContainerWidth();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { profile } = useIdentity({
    handleOrWallet,
    initialProfile,
  });
  const changeWaveDropdownRef = useRef<HTMLDivElement | null>(null);
  const changeWaveButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isChangeWaveOpen, setIsChangeWaveOpen] = useState(false);
  const [submittingWaveId, setSubmittingWaveId] = useState<string | null>(null);
  const isDesktopChangeWaveMenu = useMediaQuery("(min-width: 1024px)");

  const resolvedProfile = profile ?? initialProfile;
  const profileIdentityKey =
    getProfileIdentityKey(resolvedProfile) ?? handleOrWallet;
  const isOwnProfile = isOwnProfileRoute({
    connectedProfile,
    handleOrWallet,
  });
  const canManageOwnOfficialWave = isOwnProfile && !activeProfileProxy;
  const profileWaveId = resolvedProfile.profile_wave_id;
  const profileIdentityForMasonry: ProfileIdentitySummary = {
    id: resolvedProfile.id,
    handle: resolvedProfile.handle,
    primary_address: resolvedProfile.primary_wallet,
  };

  const {
    updateProfileWave,
    clearSelectedProfileWave,
    isPending,
    pendingAction,
  } = useProfileWaveMutation(resolvedProfile);
  const {
    data: curations,
    isLoading: areCurationsLoading,
    isError: areCurationsError,
    isFetching: areCurationsFetching,
    refetch: refetchCurations,
  } = useWaveCurations({
    waveId: profileWaveId ?? "",
    enabled: Boolean(profileWaveId),
  });
  const { wave, isLoading, isError, error, refetch, isFetching } =
    useWaveById(profileWaveId);

  const profileCuration = resolveProfileCuration(curations ?? []);
  const waveHref = wave ? getWaveHref(wave) : null;
  const hasLoadedCurations = curations !== undefined;

  useClickAway(changeWaveDropdownRef, () => {
    if (isDesktopChangeWaveMenu && isChangeWaveOpen) {
      setIsChangeWaveOpen(false);
    }
  });

  useKeyPressEvent("Escape", () => {
    if (isChangeWaveOpen) {
      setIsChangeWaveOpen(false);
    }
  });

  const openWave = () => {
    if (!waveHref) {
      return;
    }

    router.push(waveHref, { scroll: false });
  };

  const retryOfficialWaveLoad = async () => {
    await refetch();
  };

  const retryCurationsLoad = async () => {
    await refetchCurations();
  };

  const handleRemoveOfficialWave = async () => {
    await removeOfficialWave();
  };

  const removeOfficialWave = async () => {
    await clearSelectedProfileWave();
  };

  const selectOfficialWave = async (waveId: string) => {
    setSubmittingWaveId(waveId);

    try {
      const updatedProfile = await updateProfileWave(waveId);
      if (updatedProfile) {
        setIsChangeWaveOpen(false);
      }
    } finally {
      setSubmittingWaveId(null);
    }
  };

  if (!profileWaveId) {
    return (
      <UserPageProfileWavePicker
        title="Choose your official wave"
        identity={profileIdentityKey}
        isOwnProfile={isOwnProfile}
        hasActiveProfileProxy={Boolean(activeProfileProxy)}
        selectedWaveId={null}
        submittingWaveId={submittingWaveId}
        onSelectWave={selectOfficialWave}
      />
    );
  }

  if (isUnavailableWaveError(error)) {
    return (
      <InfoPanel
        title="Official wave unavailable"
        message="The official wave behind this tab could not be loaded. It may have been removed or is no longer accessible."
        actions={
          canManageOwnOfficialWave ? (
            <button
              type="button"
              onClick={handleRemoveOfficialWave}
              disabled={isPending}
              aria-label="Unset official wave"
              title="Unset official wave"
              className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-transparent tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-text-zinc-500 tw-transition tw-duration-300 tw-ease-out disabled:tw-cursor-not-allowed disabled:tw-text-iron-600 desktop-hover:hover:tw-border-rose-500/20 desktop-hover:hover:tw-bg-rose-500/10 desktop-hover:hover:tw-text-rose-400"
            >
              {isPending ? (
                <CircleLoader />
              ) : (
                <XMarkIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
              )}
              <span className="tw-hidden sm:tw-inline">Unset</span>
            </button>
          ) : undefined
        }
      />
    );
  }

  if (isLoading) {
    return <LoadingPanel label="Loading official wave..." />;
  }

  if (isError || !wave) {
    return (
      <InfoPanel
        title="Unable to load official wave"
        message="There was a temporary problem loading this profile curation."
        actions={
          <RetryButton isLoading={isFetching} onClick={retryOfficialWaveLoad} />
        }
      />
    );
  }

  return (
    <div className="tw-space-y-5">
      <div ref={changeWaveDropdownRef} className="tw-relative">
        <OfficialWaveSummary
          waveName={wave.name}
          metadataLabel={getOfficialWaveMetadataLabel({
            wave,
            areCurationsLoading,
            profileCuration,
          })}
          canManageOwnOfficialWave={canManageOwnOfficialWave}
          changeWaveDropdown={
            canManageOwnOfficialWave &&
            isDesktopChangeWaveMenu &&
            isChangeWaveOpen ? (
              <UserPageProfileWavePicker
                identity={profileIdentityKey}
                isOwnProfile={true}
                hasActiveProfileProxy={false}
                selectedWaveId={profileWaveId}
                submittingWaveId={submittingWaveId}
                onSelectWave={selectOfficialWave}
                variant="dropdown"
              />
            ) : undefined
          }
          changeWaveButtonRef={changeWaveButtonRef}
          isChangeWaveOpen={isChangeWaveOpen}
          isRemoving={isPending && pendingAction === "clear"}
          onOpenWave={openWave}
          onOpenChangeWave={() => setIsChangeWaveOpen((open) => !open)}
          onRemoveWave={handleRemoveOfficialWave}
        />
      </div>

      {!isDesktopChangeWaveMenu && canManageOwnOfficialWave && (
        <MobileWrapperDialog
          title="Switch wave"
          isOpen={isChangeWaveOpen}
          onClose={() => setIsChangeWaveOpen(false)}
        >
          <UserPageProfileWavePicker
            identity={profileIdentityKey}
            isOwnProfile={true}
            hasActiveProfileProxy={false}
            selectedWaveId={profileWaveId}
            submittingWaveId={submittingWaveId}
            onSelectWave={selectOfficialWave}
            variant="mobile-sheet"
          />
        </MobileWrapperDialog>
      )}

      <div ref={containerRef} className="tw-min-w-0 tw-flex-1">
        <UserPageProfileWaveContent
          canManageOwnOfficialWave={canManageOwnOfficialWave}
          containerWidth={containerWidth}
          onOpenWave={openWave}
          profileIdentity={profileIdentityForMasonry}
          areCurationsError={areCurationsError}
          areCurationsFetching={areCurationsFetching}
          areCurationsLoading={areCurationsLoading}
          hasLoadedCurations={hasLoadedCurations}
          onRetryCurations={retryCurationsLoad}
          profileCuration={profileCuration}
          profileWaveId={profileWaveId}
        />
      </div>
    </div>
  );
}
