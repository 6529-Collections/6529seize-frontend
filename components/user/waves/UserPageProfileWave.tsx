"use client";

import { useAuth } from "@/components/auth/Auth";
import MyStreamWaveCurationContent from "@/components/brain/my-stream/curations/MyStreamWaveCurationContent";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { Spinner } from "@/components/dotLoader/DotLoader";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import { useProfileWaveMutation } from "@/hooks/useProfileWaveMutation";
import { useWaveById } from "@/hooks/useWaveById";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import { useIdentity } from "@/hooks/useIdentity";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import { isOwnProfileRoute } from "@/helpers/ProfileHelpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { isWaveDirectMessage } from "@/helpers/waves/wave.helpers";
import {
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useCallback, useEffect, useMemo, type ReactNode } from "react";

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

export default function UserPageProfileWave({
  profile: initialProfile,
}: {
  readonly profile: ApiIdentity;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchString = useSearchParams().toString();
  const queryClient = useQueryClient();
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

  const onDropClick = useCallback(
    (drop: ExtendedDrop) => {
      queryClient.setQueryData<ApiDrop>(
        [QueryKey.DROP, { drop_id: drop.id }],
        drop as ApiDrop
      );

      const nextParams = new URLSearchParams(profileSearchString);
      nextParams.set("drop", drop.id);
      router.push(`${pathname}?${nextParams.toString()}`, { scroll: false });
    },
    [pathname, profileSearchString, queryClient, router]
  );
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

  let curationContent: ReactNode;

  if (areCurationsLoading) {
    curationContent = (
      <div className="tw-flex tw-min-h-32 tw-items-center tw-justify-center tw-text-sm tw-text-iron-400">
        <Spinner dimension={18} />
        <span className="tw-ml-3">Loading curation...</span>
      </div>
    );
  } else if (profileCuration) {
    curationContent = (
      <MyStreamWaveCurationContent
        wave={wave}
        curationId={profileCuration.id}
        curationName={profileCuration.name}
        onDropClick={onDropClick}
        constrainToViewport={false}
      />
    );
  } else {
    curationContent = (
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
    <section className="tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/70 tw-p-6 sm:tw-p-8">
      <div className="tw-flex tw-flex-col tw-gap-5">
        <div className="tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
          <div className="tw-min-w-0 tw-flex-1">
            <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-iron-500">
              Official curation
            </div>
          </div>
          <div className="tw-flex tw-flex-wrap tw-gap-3 sm:tw-justify-end">
            <PrimaryButton
              loading={false}
              disabled={false}
              onClicked={openWave}
            >
              <span>Open wave</span>
              <ArrowTopRightOnSquareIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
            </PrimaryButton>
            {canClear && (
              <SecondaryButton
                onClicked={() => void clearSelectedProfileWave()}
                disabled={isPending}
                loading={isPending && pendingAction === "clear"}
                className="tw-whitespace-nowrap"
              >
                <XMarkIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
                <span>Clear official wave</span>
              </SecondaryButton>
            )}
          </div>
        </div>

        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-overflow-hidden tw-rounded-2xl">
            {curationContent}
          </div>
        </div>
      </div>
    </section>
  );
}
