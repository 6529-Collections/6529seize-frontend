"use client";

import { useAuth } from "@/components/auth/Auth";
import { Spinner } from "@/components/dotLoader/DotLoader";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import MoveIcon from "@/components/utils/icons/MoveIcon";
import CommonConfirmationModal from "@/components/utils/modal/CommonConfirmationModal";
import UserPageProfileWaveMasonry from "@/components/user/waves/UserPageProfileWaveMasonry";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import { isOwnProfileRoute } from "@/helpers/ProfileHelpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { isWaveDirectMessage } from "@/helpers/waves/wave.helpers";
import { useIdentity } from "@/hooks/useIdentity";
import { useProfileWaveMutation } from "@/hooks/useProfileWaveMutation";
import { useWaveById } from "@/hooks/useWaveById";
import { useWaveCurationDrops } from "@/hooks/useWaveCurationDrops";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import {
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type ApiErrorLike = {
  readonly status?: number | undefined;
  readonly response?: {
    readonly status?: number | undefined;
  };
};

const getErrorStatus = (error: unknown): number | null => {
  if (error === null || error === undefined || typeof error !== "object") {
    return null;
  }

  const apiError = error as ApiErrorLike;
  return apiError.status ?? apiError.response?.status ?? null;
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "";
};

const isUnavailableWaveError = (error: unknown): boolean => {
  const status = getErrorStatus(error);
  if (status === 403 || status === 404) {
    return true;
  }

  return /not found|forbidden/i.test(getErrorMessage(error));
};

function UnavailableState({
  canClear,
  onRequestClear,
  isPending,
}: {
  readonly canClear: boolean;
  readonly onRequestClear: () => void;
  readonly isPending: boolean;
}) {
  return (
    <section className="tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/70 tw-p-6 sm:tw-p-8">
      <div className="tw-flex tw-flex-col tw-gap-5 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
        <div className="tw-max-w-xl">
          <h2 className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-50">
            Official wave unavailable
          </h2>
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
            The official wave behind this curation tab could not be loaded. It
            may have been removed or is no longer accessible.
          </p>
        </div>
        {canClear && (
          <button
            type="button"
            onClick={onRequestClear}
            disabled={isPending}
            className={`tw-flex tw-items-center tw-justify-center tw-gap-x-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-shadow-sm tw-ring-1 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 ${
              isPending
                ? "tw-cursor-not-allowed tw-border-iron-950 tw-text-iron-600 tw-ring-iron-900"
                : "tw-border-iron-950 tw-text-iron-300 tw-ring-iron-800 hover:tw-border-iron-800 hover:tw-bg-iron-800 hover:tw-ring-iron-700"
            }`}
          >
            {isPending ? (
              <CircleLoader />
            ) : (
              <XMarkIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
            )}
            <span>Clear official wave</span>
          </button>
        )}
      </div>
    </section>
  );
}

function LoadErrorState({
  description,
  isRetrying,
  onRetry,
  title,
}: {
  readonly description: string;
  readonly isRetrying: boolean;
  readonly onRetry: () => void;
  readonly title: string;
}) {
  return (
    <section className="tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/70 tw-p-6 sm:tw-p-8">
      <div className="tw-flex tw-flex-col tw-gap-5 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
        <div className="tw-max-w-xl">
          <h2 className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-50">
            {title}
          </h2>
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
            {description}
          </p>
        </div>
        <SecondaryButton
          onClicked={onRetry}
          disabled={isRetrying}
          size="sm"
          className="tw-whitespace-nowrap"
        >
          {isRetrying ? <CircleLoader /> : "Retry"}
        </SecondaryButton>
      </div>
    </section>
  );
}

const resolveProfileCuration = (
  curations: readonly ApiWaveCuration[]
): ApiWaveCuration | null => {
  let firstCreatedCuration: ApiWaveCuration | null = null;

  for (const curation of curations) {
    if (
      !firstCreatedCuration ||
      curation.created_at < firstCreatedCuration.created_at ||
      (curation.created_at === firstCreatedCuration.created_at &&
        curation.id.localeCompare(firstCreatedCuration.id) < 0)
    ) {
      firstCreatedCuration = curation;
    }
  }

  return firstCreatedCuration;
};

const getProfilePageSearchString = (searchString: string): string => {
  const params = new URLSearchParams(searchString);
  params.delete("curation");
  return params.toString();
};

const getProfileCurationTitle = (
  profileCuration: ApiWaveCuration | null
): string => {
  const title = profileCuration?.name.trim() ?? "";
  return title || "Curation";
};

function ProfileCurationBody({
  areCurationsError,
  areCurationsFetching,
  areCurationsLoading,
  canManageProfileWave,
  hasLoadedCurations,
  isReorderMode,
  onReorderModeChange,
  onRetryCurations,
  profileCuration,
  profileIdentity,
  wave,
}: {
  readonly areCurationsError: boolean;
  readonly areCurationsFetching: boolean;
  readonly areCurationsLoading: boolean;
  readonly canManageProfileWave: boolean;
  readonly hasLoadedCurations: boolean;
  readonly isReorderMode: boolean;
  readonly onReorderModeChange: (nextIsReorderMode: boolean) => void;
  readonly onRetryCurations: () => void;
  readonly profileCuration: ApiWaveCuration | null;
  readonly profileIdentity: {
    readonly id?: string | null | undefined;
    readonly handle?: string | null | undefined;
    readonly primary_address?: string | null | undefined;
  };
  readonly wave: NonNullable<ReturnType<typeof useWaveById>["wave"]>;
}) {
  if (areCurationsLoading) {
    return (
      <div className="tw-flex tw-min-h-32 tw-items-center tw-justify-center tw-text-sm tw-text-iron-400">
        <Spinner dimension={18} />
        <span className="tw-ml-3">Loading curation...</span>
      </div>
    );
  }

  if (areCurationsError && !hasLoadedCurations) {
    return (
      <LoadErrorState
        title="Unable to load curations"
        description="There was a temporary problem loading the curations in this official wave. Try again."
        isRetrying={areCurationsFetching}
        onRetry={onRetryCurations}
      />
    );
  }

  if (!profileCuration) {
    return (
      <div className="tw-p-6">
        <h2 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          No curations yet
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
          This official wave does not have any curations to show yet.
        </p>
      </div>
    );
  }

  return (
    <UserPageProfileWaveMasonry
      key={`${profileCuration.id}-${isReorderMode ? "reorder" : "browse"}`}
      wave={wave}
      curationId={profileCuration.id}
      curationName={profileCuration.name}
      canManageProfileWave={canManageProfileWave}
      showIdentity={false}
      profileIdentity={profileIdentity}
      isReorderMode={isReorderMode}
      onReorderModeChange={onReorderModeChange}
    />
  );
}

function LoadedProfileWaveState({
  areCurationsError,
  areCurationsFetching,
  areCurationsLoading,
  canClear,
  clearSelectedProfileWave,
  hasLoadedCurations,
  isPending,
  onOpenWave,
  onRetryCurations,
  pendingAction,
  profileCuration,
  profileCurationTitle,
  profileIdentity,
  wave,
}: {
  readonly areCurationsError: boolean;
  readonly areCurationsFetching: boolean;
  readonly areCurationsLoading: boolean;
  readonly canClear: boolean;
  readonly clearSelectedProfileWave: () => Promise<unknown>;
  readonly hasLoadedCurations: boolean;
  readonly isPending: boolean;
  readonly onOpenWave: () => void;
  readonly onRetryCurations: () => void;
  readonly pendingAction?: string | null | undefined;
  readonly profileCuration: ApiWaveCuration | null;
  readonly profileCurationTitle: string;
  readonly profileIdentity: {
    readonly id?: string | null | undefined;
    readonly handle?: string | null | undefined;
    readonly primary_address?: string | null | undefined;
  };
  readonly wave: NonNullable<ReturnType<typeof useWaveById>["wave"]>;
}) {
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const { drops: curationDrops } = useWaveCurationDrops({
    wave,
    curationId: profileCuration?.id ?? "",
    enabled: canClear && !!profileCuration,
  });
  const canReorder = canClear && !!profileCuration && curationDrops.length > 1;
  const isReorderModeActive = isReorderMode && canReorder;
  const isClearPending = isPending && pendingAction === "clear";
  const reorderButtonClassName = isReorderModeActive
    ? "tw-border-primary-400/50 tw-bg-primary-500/25 tw-text-primary-50 tw-ring-primary-400/40 hover:tw-border-primary-300/55 hover:tw-bg-primary-500/30 hover:tw-ring-primary-300/45"
    : "tw-border-iron-950 tw-bg-iron-950 tw-text-iron-300 tw-ring-iron-800 hover:tw-border-iron-800 hover:tw-bg-iron-800 hover:tw-ring-iron-700";
  const reorderButtonContent = isReorderModeActive ? (
    <>
      <CheckIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
      <span>Done</span>
    </>
  ) : (
    <>
      <MoveIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
      <span>Reorder</span>
    </>
  );

  function openClearConfirm() {
    setIsClearConfirmOpen(true);
  }

  function closeClearConfirm() {
    if (isClearPending) {
      return;
    }

    setIsClearConfirmOpen(false);
  }

  async function confirmClearProfileWave() {
    await clearSelectedProfileWave();
    setIsClearConfirmOpen(false);
  }

  function toggleReorderMode() {
    setIsReorderMode((current) => !current);
  }

  return (
    <>
      <section className="tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-bg-black tw-p-4 sm:tw-p-5">
        <div className="tw-flex tw-flex-col tw-gap-5">
          <div className="tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
            <div className="tw-min-w-0">
              <h2 className="tw-mb-1 tw-truncate tw-text-xl tw-font-semibold tw-text-iron-100">
                {profileCurationTitle}
              </h2>
            </div>

            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 sm:tw-justify-end">
              {canReorder && (
                <button
                  type="button"
                  onClick={toggleReorderMode}
                  aria-label={isReorderModeActive ? "Done" : "Reorder"}
                  className={`tw-flex tw-items-center tw-justify-center tw-gap-x-1.5 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-shadow-sm tw-ring-1 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 ${reorderButtonClassName}`}
                >
                  {reorderButtonContent}
                </button>
              )}
              {!isReorderModeActive && (
                <button
                  type="button"
                  onClick={onOpenWave}
                  className="tw-flex tw-items-center tw-justify-center tw-gap-x-2 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-white tw-bg-white tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-950 tw-shadow-sm tw-ring-1 tw-ring-white/15 tw-transition tw-duration-300 tw-ease-out hover:tw-border-iron-200 hover:tw-bg-iron-100 hover:tw-ring-white/10 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
                >
                  <span>Open wave</span>
                  <ArrowTopRightOnSquareIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
                </button>
              )}
              {!isReorderModeActive && canClear && (
                <button
                  type="button"
                  onClick={openClearConfirm}
                  disabled={isPending}
                  className={`tw-flex tw-items-center tw-justify-center tw-gap-x-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-shadow-sm tw-ring-1 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 ${
                    isPending
                      ? "tw-cursor-not-allowed tw-border-iron-950 tw-text-iron-600 tw-ring-iron-900"
                      : "tw-border-iron-950 tw-text-iron-300 tw-ring-iron-800 hover:tw-border-iron-800 hover:tw-bg-iron-800 hover:tw-ring-iron-700"
                  }`}
                >
                  {isClearPending ? (
                    <CircleLoader />
                  ) : (
                    <XMarkIcon className="-tw-ml-1.5 tw-h-4 tw-w-4 tw-flex-shrink-0" />
                  )}
                  <span>Clear official wave</span>
                </button>
              )}
            </div>
          </div>

          <div className="tw-min-w-0 tw-flex-1">
            <div className="tw-overflow-hidden tw-rounded-2xl">
              <ProfileCurationBody
                areCurationsError={areCurationsError}
                areCurationsFetching={areCurationsFetching}
                areCurationsLoading={areCurationsLoading}
                canManageProfileWave={canClear}
                hasLoadedCurations={hasLoadedCurations}
                isReorderMode={isReorderModeActive}
                onReorderModeChange={setIsReorderMode}
                onRetryCurations={onRetryCurations}
                profileCuration={profileCuration}
                profileIdentity={profileIdentity}
                wave={wave}
              />
            </div>
          </div>
        </div>
      </section>
      {canClear && (
        <CommonConfirmationModal
          isOpen={isClearConfirmOpen}
          onClose={closeClearConfirm}
          onConfirm={() => {
            confirmClearProfileWave().catch(() => undefined);
          }}
          title="Clear official wave"
          message="Are you sure you want to clear the official wave from this profile?"
          confirmText="Clear official wave"
          isConfirming={isClearPending}
        />
      )}
    </>
  );
}

export default function UserPageProfileWave({
  profile: initialProfile,
}: {
  readonly profile: ApiIdentity;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();
  const handleOrWallet = params["user"]?.toString() ?? "";
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { profile } = useIdentity({
    handleOrWallet,
    initialProfile,
  });
  const [isUnavailableClearConfirmOpen, setIsUnavailableClearConfirmOpen] =
    useState(false);
  const resolvedProfile = profile ?? initialProfile;
  const profileWaveId = resolvedProfile.profile_wave_id;
  const { wave, isLoading, isError, error, refetch, isFetching } =
    useWaveById(profileWaveId);
  const {
    data: curations,
    isLoading: areCurationsLoading,
    isError: areCurationsError,
    isFetching: areCurationsFetching,
    refetch: refetchCurations,
  } = useWaveCurations({
    waveId: wave?.id ?? "",
    enabled: !!wave?.id,
  });
  const { clearSelectedProfileWave, isPending, pendingAction } =
    useProfileWaveMutation(resolvedProfile);
  const isOwnProfile = isOwnProfileRoute({
    connectedProfile,
    handleOrWallet,
  });
  const canClear = isOwnProfile && !activeProfileProxy;
  const hasUnavailableWaveError = isUnavailableWaveError(error);
  const profileSearchString = useMemo(
    () => getProfilePageSearchString(searchString),
    [searchString]
  );
  const hasLoadedCurations = curations !== undefined;
  const profileCuration = useMemo(
    () => resolveProfileCuration(curations ?? []),
    [curations]
  );
  const profileCurationTitle = useMemo(
    () => getProfileCurationTitle(profileCuration),
    [profileCuration]
  );
  const profileIdentityForMasonry = useMemo(
    () => ({
      id: resolvedProfile.id,
      handle: resolvedProfile.handle,
      primary_address: resolvedProfile.primary_wallet,
    }),
    [resolvedProfile.handle, resolvedProfile.id, resolvedProfile.primary_wallet]
  );
  const waveHref = useMemo(() => {
    if (!wave) {
      return null;
    }

    const baseWaveHref = getWaveRoute({
      waveId: wave.id,
      isDirectMessage: isWaveDirectMessage(wave.id, wave),
      isApp: false,
    });

    if (!profileCuration) {
      return baseWaveHref;
    }

    return `${baseWaveHref}?${new URLSearchParams({
      curation: profileCuration.id,
    }).toString()}`;
  }, [profileCuration, wave]);

  useEffect(() => {
    if (profileSearchString === searchString) {
      return;
    }

    const nextUrl = profileSearchString
      ? `${pathname}?${profileSearchString}`
      : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, profileSearchString, router, searchString]);

  const openWave = useCallback(() => {
    if (!waveHref) {
      return;
    }

    router.push(waveHref, { scroll: false });
  }, [router, waveHref]);

  const retryLoad = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const retryCurationsLoad = useCallback(async () => {
    await refetchCurations();
  }, [refetchCurations]);

  function openUnavailableClearConfirm() {
    setIsUnavailableClearConfirmOpen(true);
  }

  function closeUnavailableClearConfirm() {
    if (isPending && pendingAction === "clear") {
      return;
    }

    setIsUnavailableClearConfirmOpen(false);
  }

  async function confirmUnavailableClearProfileWave() {
    await clearSelectedProfileWave();
    setIsUnavailableClearConfirmOpen(false);
  }

  if (!profileWaveId) {
    return null;
  }

  if (isLoading) {
    return (
      <section
        className="tw-flex tw-min-h-[16rem] tw-items-center tw-justify-center tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/70"
        aria-label="Loading profile wave"
      >
        <div className="tw-flex tw-items-center tw-gap-3 tw-text-sm tw-text-iron-400">
          <Spinner dimension={18} />
          Loading profile wave...
        </div>
      </section>
    );
  }

  if (hasUnavailableWaveError) {
    return (
      <>
        <UnavailableState
          canClear={canClear}
          isPending={isPending}
          onRequestClear={openUnavailableClearConfirm}
        />
        {canClear && (
          <CommonConfirmationModal
            isOpen={isUnavailableClearConfirmOpen}
            onClose={closeUnavailableClearConfirm}
            onConfirm={() => {
              confirmUnavailableClearProfileWave().catch(() => undefined);
            }}
            title="Clear official wave"
            message="Are you sure you want to clear the official wave from this profile?"
            confirmText="Clear official wave"
            isConfirming={isPending && pendingAction === "clear"}
          />
        )}
      </>
    );
  }

  if (isError || !wave) {
    return (
      <LoadErrorState
        title="Unable to load official wave"
        description="There was a temporary problem loading this profile curation. Try again."
        isRetrying={isFetching}
        onRetry={retryLoad}
      />
    );
  }

  return (
    <LoadedProfileWaveState
      key={`${wave.id}:${profileCuration?.id ?? "none"}`}
      areCurationsError={areCurationsError}
      areCurationsFetching={areCurationsFetching}
      areCurationsLoading={areCurationsLoading}
      canClear={canClear}
      clearSelectedProfileWave={clearSelectedProfileWave}
      hasLoadedCurations={hasLoadedCurations}
      isPending={isPending}
      onOpenWave={openWave}
      onRetryCurations={retryCurationsLoad}
      pendingAction={pendingAction}
      profileCuration={profileCuration}
      profileCurationTitle={profileCurationTitle}
      profileIdentity={profileIdentityForMasonry}
      wave={wave}
    />
  );
}
