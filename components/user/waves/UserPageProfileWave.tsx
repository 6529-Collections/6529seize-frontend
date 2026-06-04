"use client";

import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import { isOwnProfileRoute } from "@/helpers/ProfileHelpers";
import { useIdentity } from "@/hooks/useIdentity";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useProfileWave } from "@/hooks/useProfileWave";
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
  getProfileCurationTitle,
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
import type { ApiProfileWaveResponse } from "@/services/api/profile-wave-api";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

type CurationPickerVariant = "dropdown" | "mobile-sheet";

const MyStreamWaveCurationCreateDialog = dynamic(
  () =>
    import("@/components/brain/my-stream/tabs/MyStreamWaveCurationCreateDialog"),
  { loading: () => null }
);

const UserPageProfileWaveQuickPostDialog = dynamic(
  () => import("./UserPageProfileWaveQuickPostDialog"),
  { loading: () => null }
);

type ProfileCurationPickerProps = {
  readonly curations: readonly ApiWaveCuration[];
  readonly selectedCurationId: string | null;
  readonly submittingCurationId: string | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly isFetching: boolean;
  readonly onRetry: () => void;
  readonly onSelectCuration: (curationId: string) => void;
  readonly variant: CurationPickerVariant;
};

function ProfileCurationPicker({
  curations,
  selectedCurationId,
  submittingCurationId,
  isLoading,
  isError,
  isFetching,
  onRetry,
  onSelectCuration,
  variant,
}: ProfileCurationPickerProps) {
  const isMobileSheet = variant === "mobile-sheet";
  const wrapperClassName = isMobileSheet
    ? "tw-px-4 sm:tw-px-6"
    : "tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-py-2 tw-shadow-2xl";
  const rowPadding = isMobileSheet ? "tw-px-4 tw-py-3" : "tw-px-3 tw-py-2.5";
  const isAnySubmitting = submittingCurationId !== null;

  const renderRow = ({
    id,
    label,
    isSelected,
    isSubmitting,
    onClick,
  }: {
    readonly id: string;
    readonly label: string;
    readonly isSelected: boolean;
    readonly isSubmitting: boolean;
    readonly onClick: () => void;
  }) => {
    let trailingContent: ReactNode = null;
    if (isSubmitting) {
      trailingContent = <CircleLoader />;
    } else if (isSelected) {
      trailingContent = (
        <CheckCircleIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-emerald-400" />
      );
    }

    return (
      <button
        key={id}
        type="button"
        onClick={onClick}
        disabled={isAnySubmitting || isSelected}
        className={`tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-3 tw-rounded-xl tw-border-0 tw-text-left tw-font-medium tw-text-white tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 disabled:tw-cursor-default ${rowPadding} ${
          isSelected
            ? "tw-bg-white/10"
            : "tw-bg-transparent desktop-hover:hover:tw-bg-white/5"
        }`}
      >
        <span className="tw-min-w-0 tw-flex-1 tw-truncate tw-text-sm">
          {label}
        </span>
        {trailingContent}
      </button>
    );
  };

  let content: ReactNode;
  if (isLoading) {
    content = (
      <div className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-3 tw-text-sm tw-text-iron-500">
        <CircleLoader />
        <span>Loading curations...</span>
      </div>
    );
  } else if (isError) {
    content = (
      <div className="tw-flex tw-flex-col tw-items-start tw-gap-3 tw-px-3 tw-py-3 tw-text-sm tw-text-iron-500">
        <span>Unable to load curations.</span>
        <RetryButton isLoading={isFetching} onClick={onRetry} />
      </div>
    );
  } else if (curations.length === 0) {
    content = (
      <p className="tw-mb-0 tw-px-3 tw-py-3 tw-text-sm tw-text-iron-500">
        This wave has no curations yet.
      </p>
    );
  } else {
    content = (
      <>
        {curations.map((curation) =>
          renderRow({
            id: curation.id,
            label: curation.name,
            isSelected: selectedCurationId === curation.id,
            isSubmitting: submittingCurationId === curation.id,
            onClick: () => onSelectCuration(curation.id),
          })
        )}
      </>
    );
  }

  return (
    <section className={wrapperClassName}>
      <div className="tw-flex tw-flex-col tw-gap-1 tw-px-1.5">
        {!isMobileSheet && (
          <p className="tw-mb-0 tw-px-3 tw-pb-1 tw-pt-2 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
            Profile curation
          </p>
        )}
        {content}
      </div>
    </section>
  );
}

function ProfileCurationPickerPanel({
  show,
  ...pickerProps
}: ProfileCurationPickerProps & {
  readonly show: boolean;
}) {
  if (!show) {
    return null;
  }

  return <ProfileCurationPicker {...pickerProps} />;
}

function ProfileCurationMobileDialog({
  show,
  isOpen,
  onClose,
  ...pickerProps
}: Omit<ProfileCurationPickerProps, "variant"> & {
  readonly show: boolean;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}) {
  if (!show) {
    return null;
  }

  return (
    <MobileWrapperDialog
      title="Switch curation"
      isOpen={isOpen}
      onClose={onClose}
    >
      <ProfileCurationPicker {...pickerProps} variant="mobile-sheet" />
    </MobileWrapperDialog>
  );
}

const isDesktopCurationPickerOpen = ({
  canSwitchOfficialCuration,
  isDesktopChangeWaveMenu,
  isChangeCurationOpen,
}: {
  readonly canSwitchOfficialCuration: boolean;
  readonly isDesktopChangeWaveMenu: boolean;
  readonly isChangeCurationOpen: boolean;
}): boolean =>
  canSwitchOfficialCuration && isDesktopChangeWaveMenu && isChangeCurationOpen;

const shouldRenderMobileCurationPicker = ({
  canSwitchOfficialCuration,
  isDesktopChangeWaveMenu,
}: {
  readonly canSwitchOfficialCuration: boolean;
  readonly isDesktopChangeWaveMenu: boolean;
}): boolean => canSwitchOfficialCuration && !isDesktopChangeWaveMenu;

const getProfileCurationAddPostHandler = ({
  profileCuration,
  onAddPost,
}: {
  readonly profileCuration: ApiWaveCuration | null;
  readonly onAddPost: () => void;
}): (() => void) | undefined =>
  profileCuration === null ? undefined : onAddPost;

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
  const changeCurationDropdownRef = useRef<HTMLDivElement | null>(null);
  const changeWaveButtonRef = useRef<HTMLButtonElement | null>(null);
  const changeCurationButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isChangeWaveOpen, setIsChangeWaveOpen] = useState(false);
  const [isChangeCurationOpen, setIsChangeCurationOpen] = useState(false);
  const [isCreateCurationOpen, setIsCreateCurationOpen] = useState(false);
  const [isQuickPostOpen, setIsQuickPostOpen] = useState(false);
  const [submittingWaveId, setSubmittingWaveId] = useState<string | null>(null);
  const [submittingCurationId, setSubmittingCurationId] = useState<
    string | null
  >(null);
  const isDesktopChangeWaveMenu = useMediaQuery("(min-width: 1024px)");

  const resolvedProfile = profile ?? initialProfile;
  const profileIdentityKey =
    getProfileIdentityKey(resolvedProfile) ?? handleOrWallet;
  const hasCreatedProfile = Boolean(resolvedProfile.handle?.trim());
  const initialProfileWave = useMemo<ApiProfileWaveResponse>(
    () => ({
      profile_wave_id: resolvedProfile.profile_wave_id,
      profile_curation_id: null,
    }),
    [resolvedProfile.profile_wave_id]
  );
  const { data: profileWave } = useProfileWave({
    identity: profileIdentityKey,
    initialProfileWave,
  });
  const isOwnProfile = isOwnProfileRoute({
    connectedProfile,
    handleOrWallet,
  });
  const canManageOwnOfficialWave = isOwnProfile && !activeProfileProxy;
  const profileWaveId = profileWave?.profile_wave_id ?? null;
  const profileCurationId = profileWave?.profile_curation_id ?? null;
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

  const profileCuration = resolveProfileCuration(
    curations ?? [],
    profileCurationId
  );
  const waveHref = wave ? getWaveHref(wave, profileCuration?.id ?? null) : null;
  const hasLoadedCurations = curations !== undefined;
  const canSwitchOfficialCuration =
    canManageOwnOfficialWave && (curations?.length ?? 0) > 0;
  const showDesktopCurationPicker = isDesktopCurationPickerOpen({
    canSwitchOfficialCuration,
    isDesktopChangeWaveMenu,
    isChangeCurationOpen,
  });
  const showMobileCurationPicker = shouldRenderMobileCurationPicker({
    canSwitchOfficialCuration,
    isDesktopChangeWaveMenu,
  });
  const openQuickPost = () => setIsQuickPostOpen(true);
  const addPostHandler = getProfileCurationAddPostHandler({
    profileCuration,
    onAddPost: openQuickPost,
  });

  useClickAway(changeWaveDropdownRef, () => {
    if (isDesktopChangeWaveMenu && isChangeWaveOpen) {
      setIsChangeWaveOpen(false);
    }
  });

  useClickAway(changeCurationDropdownRef, () => {
    if (isDesktopChangeWaveMenu && isChangeCurationOpen) {
      setIsChangeCurationOpen(false);
    }
  });

  useKeyPressEvent("Escape", () => {
    if (isChangeWaveOpen) {
      setIsChangeWaveOpen(false);
    }
    if (isChangeCurationOpen) {
      setIsChangeCurationOpen(false);
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

  const selectOfficialCuration = async (curationId: string) => {
    if (!profileWaveId) {
      return;
    }

    setSubmittingCurationId(curationId);

    try {
      const updatedProfile = await updateProfileWave(profileWaveId, curationId);
      if (updatedProfile) {
        setIsChangeCurationOpen(false);
      }
    } finally {
      setSubmittingCurationId(null);
    }
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
        setIsChangeCurationOpen(false);
      }
    } finally {
      setSubmittingWaveId(null);
    }
  };

  if (!profileWaveId) {
    return (
      <UserPageProfileWavePicker
        title="Choose your featured wave"
        identity={profileIdentityKey}
        isOwnProfile={isOwnProfile}
        hasCreatedProfile={hasCreatedProfile}
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
        title="Featured wave unavailable"
        message="The featured wave behind this tab could not be loaded. It may have been removed or is no longer accessible."
        actions={
          canManageOwnOfficialWave ? (
            <button
              type="button"
              onClick={handleRemoveOfficialWave}
              disabled={isPending}
              aria-label="Unset featured wave"
              title="Unset featured wave"
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
    return <LoadingPanel label="Loading featured wave..." />;
  }

  if (isError || !wave) {
    return (
      <InfoPanel
        title="Unable to load featured wave"
        message="There was a temporary problem loading this profile curation."
        actions={
          <RetryButton isLoading={isFetching} onClick={retryOfficialWaveLoad} />
        }
      />
    );
  }

  return (
    <div className="tw-space-y-5">
      <div className="tw-relative">
        <OfficialWaveSummary
          waveName={wave.name}
          metadataLabel={getOfficialWaveMetadataLabel(wave)}
          profileCurationLabel={
            profileCuration ? getProfileCurationTitle(profileCuration) : null
          }
          canManageOwnOfficialWave={canManageOwnOfficialWave}
          changeWaveDropdown={
            canManageOwnOfficialWave &&
            isDesktopChangeWaveMenu &&
            isChangeWaveOpen ? (
              <UserPageProfileWavePicker
                identity={profileIdentityKey}
                isOwnProfile={true}
                hasCreatedProfile={hasCreatedProfile}
                hasActiveProfileProxy={false}
                selectedWaveId={profileWaveId}
                submittingWaveId={submittingWaveId}
                onSelectWave={selectOfficialWave}
                variant="dropdown"
              />
            ) : undefined
          }
          changeCurationDropdown={
            <ProfileCurationPickerPanel
              show={showDesktopCurationPicker}
              curations={curations ?? []}
              selectedCurationId={profileCuration?.id ?? null}
              submittingCurationId={submittingCurationId}
              isLoading={areCurationsLoading}
              isError={areCurationsError}
              isFetching={areCurationsFetching}
              onRetry={retryCurationsLoad}
              onSelectCuration={(curationId) =>
                selectOfficialCuration(curationId)
              }
              variant="dropdown"
            />
          }
          changeWaveDropdownRef={changeWaveDropdownRef}
          changeCurationDropdownRef={changeCurationDropdownRef}
          changeWaveButtonRef={changeWaveButtonRef}
          changeCurationButtonRef={changeCurationButtonRef}
          isChangeWaveOpen={isChangeWaveOpen}
          isChangeCurationOpen={isChangeCurationOpen}
          isRemoving={isPending && pendingAction === "clear"}
          isChangingCuration={submittingCurationId !== null}
          showChangeCuration={canSwitchOfficialCuration}
          onOpenWave={openWave}
          onAddPost={addPostHandler}
          onOpenChangeWave={() => {
            setIsChangeCurationOpen(false);
            setIsChangeWaveOpen((open) => !open);
          }}
          onOpenChangeCuration={() => {
            setIsChangeWaveOpen(false);
            setIsChangeCurationOpen((open) => !open);
          }}
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
            hasCreatedProfile={hasCreatedProfile}
            hasActiveProfileProxy={false}
            selectedWaveId={profileWaveId}
            submittingWaveId={submittingWaveId}
            onSelectWave={selectOfficialWave}
            variant="mobile-sheet"
          />
        </MobileWrapperDialog>
      )}

      <ProfileCurationMobileDialog
        show={showMobileCurationPicker}
        isOpen={isChangeCurationOpen}
        onClose={() => setIsChangeCurationOpen(false)}
        curations={curations ?? []}
        selectedCurationId={profileCuration?.id ?? null}
        submittingCurationId={submittingCurationId}
        isLoading={areCurationsLoading}
        isError={areCurationsError}
        isFetching={areCurationsFetching}
        onRetry={retryCurationsLoad}
        onSelectCuration={(curationId) => selectOfficialCuration(curationId)}
      />

      {isCreateCurationOpen && canManageOwnOfficialWave && (
        <MyStreamWaveCurationCreateDialog
          wave={wave}
          isOpen={isCreateCurationOpen}
          onClose={() => setIsCreateCurationOpen(false)}
          onSaved={(curation) => selectOfficialCuration(curation.id)}
        />
      )}

      {isQuickPostOpen && canManageOwnOfficialWave && profileCuration && (
        <UserPageProfileWaveQuickPostDialog
          wave={wave}
          curation={profileCuration}
          isOpen={isQuickPostOpen}
          onClose={() => setIsQuickPostOpen(false)}
        />
      )}

      <div ref={containerRef} className="tw-min-w-0 tw-flex-1">
        <UserPageProfileWaveContent
          canManageOwnOfficialWave={canManageOwnOfficialWave}
          containerWidth={containerWidth}
          onCreateCuration={() => setIsCreateCurationOpen(true)}
          profileIdentity={profileIdentityForMasonry}
          areCurationsError={areCurationsError}
          areCurationsFetching={areCurationsFetching}
          areCurationsLoading={areCurationsLoading}
          hasLoadedCurations={hasLoadedCurations}
          onRetryCurations={retryCurationsLoad}
          profileCuration={profileCuration}
          wave={wave}
        />
      </div>
    </div>
  );
}
