"use client";

import { useAuth } from "@/components/auth/Auth";
import { Spinner } from "@/components/dotLoader/DotLoader";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import MyStreamWaveCurationContent from "@/components/brain/my-stream/curations/MyStreamWaveCurationContent";
import UserPageProfileWaveMasonry from "@/components/user/waves/UserPageProfileWaveMasonry";
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
  Bars3Icon,
  Squares2X2Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

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
          <SecondaryButton
            onClicked={() => void onClear()}
            disabled={isPending}
            loading={isPending}
            size="sm"
            className="tw-whitespace-nowrap"
          >
            <XMarkIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
            <span>Clear official wave</span>
          </SecondaryButton>
        )}
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
  onToggle,
}: {
  readonly viewMode: "masonry" | "list";
  readonly onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={
        viewMode === "masonry"
          ? "Switch to list view"
          : "Switch to masonry view"
      }
      title={
        viewMode === "masonry"
          ? "Switch to list view"
          : "Switch to masonry view"
      }
      className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white"
    >
      {viewMode === "masonry" ? (
        <Bars3Icon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
      ) : (
        <Squares2X2Icon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
      )}
    </button>
  );
}

const getProfileCurationTitle = (
  profileCuration: ApiWaveCuration | null
): string => {
  const title = profileCuration?.name.trim() ?? "";
  return title || "Curation";
};

function ProfileCurationBody({
  areCurationsLoading,
  profileCuration,
  profileIdentity,
  viewMode,
  wave,
}: {
  readonly areCurationsLoading: boolean;
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
  const searchString = useSearchParams().toString();
  const handleOrWallet = params["user"]?.toString() ?? "";
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { profile } = useIdentity({
    handleOrWallet,
    initialProfile,
  });
  const resolvedProfile = profile ?? initialProfile;
  const profileWaveId = resolvedProfile.profile_wave_id;
  const { wave, isLoading, isError } = useWaveById(profileWaveId);
  const { data: curations = [], isLoading: areCurationsLoading } =
    useWaveCurations({
      waveId: wave?.id ?? "",
      enabled: !!wave?.id,
    });
  const { clearSelectedProfileWave, isPending, pendingAction } =
    useProfileWaveMutation(resolvedProfile);
  const { viewMode, toggleViewMode } = useProfileCurationViewMode(
    profileWaveId ?? handleOrWallet
  );
  const isOwnProfile = isOwnProfileRoute({
    connectedProfile,
    handleOrWallet,
  });
  const canClear = isOwnProfile && !activeProfileProxy;
  const profileSearchString = useMemo(
    () => getProfilePageSearchString(searchString),
    [searchString]
  );
  const profileCuration = useMemo(
    () => resolveProfileCuration(curations),
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

  if (isError || !wave) {
    return (
      <UnavailableState
        canClear={canClear}
        isPending={isPending}
        onClear={clearSelectedProfileWave}
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
                onToggle={toggleViewMode}
              />
            )}
            <SecondaryButton
              onClicked={openWave}
              size="sm"
              className="tw-whitespace-nowrap"
            >
              <span>Open wave</span>
              <ArrowTopRightOnSquareIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
            </SecondaryButton>
            {canClear && (
              <button
                type="button"
                onClick={() => void clearSelectedProfileWave()}
                disabled={isPending}
                className={[
                  "tw-group tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-gap-1 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-transition-all tw-duration-300 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 disabled:tw-cursor-not-allowed disabled:tw-opacity-60",
                  isPending && pendingAction === "clear"
                    ? "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-300"
                    : "tw-border-iron-800 tw-bg-iron-950/60 tw-text-iron-200 hover:tw-border-iron-700 hover:tw-bg-iron-900",
                ].join(" ")}
              >
                {isPending && pendingAction === "clear" ? (
                  <Spinner dimension={14} />
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
              areCurationsLoading={areCurationsLoading}
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
