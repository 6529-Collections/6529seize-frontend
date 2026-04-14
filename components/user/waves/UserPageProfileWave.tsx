"use client";

import { useAuth } from "@/components/auth/Auth";
import { Spinner } from "@/components/dotLoader/DotLoader";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import MyStreamWaveCurationContent from "@/components/brain/my-stream/curations/MyStreamWaveCurationContent";
import UserPageProfileWaveMasonry from "@/components/user/waves/UserPageProfileWaveMasonry";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useProfileCurationViewMode } from "@/hooks/useProfileCurationViewMode";
import { useProfileWaveMutation } from "@/hooks/useProfileWaveMutation";
import { useWaveById } from "@/hooks/useWaveById";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import { useIdentity } from "@/hooks/useIdentity";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import { isOwnProfileRoute } from "@/helpers/ProfileHelpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { isWaveDirectMessage } from "@/helpers/waves/wave.helpers";
import {
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { Tooltip } from "react-tooltip";

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
  onClear,
  isPending,
}: {
  readonly canClear: boolean;
  readonly onClear: () => Promise<unknown>;
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
            onClick={onClear}
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

function ProfileCurationViewToggle({
  viewMode,
  onChange,
}: {
  readonly viewMode: "masonry" | "list";
  readonly onChange: (mode: "masonry" | "list") => void;
}) {
  const viewModes = [
    {
      mode: "list" as const,
      label: "List view",
      tooltipId: "profile-curation-view-toggle-list",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          aria-hidden="true"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="tw-size-5 tw-flex-shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>
      ),
    },
    {
      mode: "masonry" as const,
      label: "Grid view",
      tooltipId: "profile-curation-view-toggle-grid",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          aria-hidden="true"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="tw-size-5 tw-flex-shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
          />
        </svg>
      ),
    },
  ];

  const getViewModeTabClass = (mode: "masonry" | "list"): string => {
    const baseClassName =
      "tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-transparent tw-transition-colors";

    if (viewMode === mode) {
      return `${baseClassName} tw-border-primary-500/50 tw-bg-primary-600/20 tw-text-primary-400`;
    }

    return `${baseClassName} tw-bg-transparent tw-text-iron-500 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-iron-300`;
  };

  return (
    <div
      role="tablist"
      aria-label="Profile curation view modes"
      className="tw-flex tw-flex-shrink-0 tw-gap-0.5 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-1"
    >
      {viewModes.map((mode) => (
        <div key={mode.mode}>
          <button
            type="button"
            role="tab"
            aria-label={mode.label}
            aria-selected={viewMode === mode.mode}
            tabIndex={viewMode === mode.mode ? 0 : -1}
            className={getViewModeTabClass(mode.mode)}
            onClick={() => onChange(mode.mode)}
            data-tooltip-id={mode.tooltipId}
          >
            {mode.icon}
            <span className="tw-sr-only">{mode.label}</span>
          </button>
          <Tooltip
            id={mode.tooltipId}
            place="top"
            offset={8}
            opacity={1}
            positionStrategy="fixed"
            style={TOOLTIP_STYLES}
          >
            <span className="tw-text-xs">{mode.label}</span>
          </Tooltip>
        </div>
      ))}
    </div>
  );
}

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
  hasLoadedCurations,
  onRetryCurations,
  profileCuration,
  profileIdentity,
  viewMode,
  wave,
}: {
  readonly areCurationsError: boolean;
  readonly areCurationsFetching: boolean;
  readonly areCurationsLoading: boolean;
  readonly hasLoadedCurations: boolean;
  readonly onRetryCurations: () => void;
  readonly profileCuration: ApiWaveCuration | null;
  readonly profileIdentity: {
    readonly id?: string | null | undefined;
    readonly handle?: string | null | undefined;
    readonly primary_address?: string | null | undefined;
  };
  readonly viewMode: "masonry" | "list";
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

  if (viewMode === "masonry") {
    return (
      <UserPageProfileWaveMasonry
        wave={wave}
        curationId={profileCuration.id}
        curationName={profileCuration.name}
        showIdentity={false}
        profileIdentity={profileIdentity}
      />
    );
  }

  return (
    <MyStreamWaveCurationContent
      wave={wave}
      curationId={profileCuration.id}
      curationName={profileCuration.name}
      constrainToViewport={false}
    />
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
  const { viewMode, setViewMode } = useProfileCurationViewMode();
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
  const clearProfileWave = useCallback(async () => {
    await clearSelectedProfileWave();
  }, [clearSelectedProfileWave]);

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
      <UnavailableState
        canClear={canClear}
        isPending={isPending}
        onClear={clearProfileWave}
      />
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
    <section className="tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-bg-black tw-p-4 sm:tw-p-5">
      <div className="tw-flex tw-flex-col tw-gap-5">
        <div className="tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
          <div className="tw-min-w-0">
            <h2 className="tw-mb-1 tw-truncate tw-text-xl tw-font-semibold tw-text-iron-100">
              {profileCurationTitle}
            </h2>
          </div>

          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 sm:tw-justify-end">
            {profileCuration && (
              <ProfileCurationViewToggle
                viewMode={viewMode}
                onChange={setViewMode}
              />
            )}
            <button
              type="button"
              onClick={openWave}
              className="tw-flex tw-items-center tw-justify-center tw-gap-x-2 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-white tw-bg-white tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-950 tw-shadow-sm tw-ring-1 tw-ring-white/15 tw-transition tw-duration-300 tw-ease-out hover:tw-border-iron-200 hover:tw-bg-iron-100 hover:tw-ring-white/10 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
            >
              <span>Open wave</span>
              <ArrowTopRightOnSquareIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
            </button>
            {canClear && (
              <button
                type="button"
                onClick={clearProfileWave}
                disabled={isPending}
                className={`tw-flex tw-items-center tw-justify-center tw-gap-x-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-shadow-sm tw-ring-1 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 ${
                  isPending
                    ? "tw-cursor-not-allowed tw-border-iron-950 tw-text-iron-600 tw-ring-iron-900"
                    : "tw-border-iron-950 tw-text-iron-300 tw-ring-iron-800 hover:tw-border-iron-800 hover:tw-bg-iron-800 hover:tw-ring-iron-700"
                }`}
              >
                {isPending && pendingAction === "clear" ? (
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
              hasLoadedCurations={hasLoadedCurations}
              onRetryCurations={retryCurationsLoad}
              profileCuration={profileCuration}
              profileIdentity={profileIdentityForMasonry}
              viewMode={viewMode}
              wave={wave}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
