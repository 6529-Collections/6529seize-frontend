"use client";

import { useAuth } from "@/components/auth/Auth";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import type { ApiBlockedProfile } from "@/generated/models/ApiBlockedProfile";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  fetchBlockedProfiles,
  unblockProfile,
} from "@/services/api/content-moderation-api";
import {
  getProfileBlockedOverride,
  setProfileBlockedOverride,
} from "@/services/content-moderation/content-moderation-state";
import {
  BLOCKED_PROFILES_QUERY_KEY,
  invalidateContentModerationPresentation,
  reconcileIdentityFollowingAfterBlockChange,
} from "@/services/content-moderation/content-moderation-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

function BlockedProfileRow({
  profile,
  viewerProfileId,
  queryKey,
}: {
  readonly profile: ApiBlockedProfile;
  readonly viewerProfileId: string;
  readonly queryKey: readonly unknown[];
}) {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => unblockProfile(profile.profile_id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousProfiles =
        queryClient.getQueryData<ApiBlockedProfile[]>(queryKey);
      const previousBlocked = getProfileBlockedOverride(
        viewerProfileId,
        profile.profile_id
      );
      setProfileBlockedOverride(viewerProfileId, profile.profile_id, false);
      queryClient.setQueryData<ApiBlockedProfile[]>(queryKey, (current) =>
        current?.filter(
          (blockedProfile) => blockedProfile.profile_id !== profile.profile_id
        )
      );
      return { previousBlocked, previousProfiles };
    },
    onSuccess: () => {
      void reconcileIdentityFollowingAfterBlockChange(
        queryClient,
        profile.handle
      );
      void invalidateContentModerationPresentation(queryClient);
    },
    onError: (error, _variables, context) => {
      setProfileBlockedOverride(
        viewerProfileId,
        profile.profile_id,
        context?.previousBlocked
      );
      if (context?.previousProfiles) {
        queryClient.setQueryData(queryKey, context.previousProfiles);
      }
      setToast({
        type: "error",
        title: t(locale, "contentModeration.unblock.error"),
        description: t(locale, "contentModeration.error.retry"),
        details: getToastErrorDetails(error),
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return (
    <li className="tw-flex tw-items-center tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4 last:tw-border-b-0">
      <Link
        href={`/${encodeURIComponent(profile.handle ?? profile.profile_id)}`}
        className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-4 tw-rounded-lg tw-text-inherit tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        aria-label={t(locale, "contentModeration.preferences.openProfile", {
          profile: profile.handle ?? profile.profile_id,
        })}
      >
        <span className="tw-relative tw-size-10 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800">
          {profile.pfp && (
            <Image
              src={resolveIpfsUrlSync(profile.pfp)}
              alt=""
              fill
              sizes="40px"
              className="tw-object-cover"
            />
          )}
        </span>
        <p className="tw-m-0 tw-truncate tw-font-semibold tw-text-iron-100">
          {profile.handle ?? profile.profile_id}
        </p>
      </Link>
      <button
        type="button"
        aria-label={t(locale, "contentModeration.actions.unblockProfile", {
          profile: profile.handle ?? profile.profile_id,
        })}
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
        className="tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-default disabled:tw-opacity-50"
      >
        {t(locale, "contentModeration.actions.unblock")}
      </button>
    </li>
  );
}

export default function ContentPreferencesSettings() {
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const viewerProfileId = connectedProfile?.id ?? null;
  const canLoad = viewerProfileId !== null && activeProfileProxy === null;
  const queryKey = [...BLOCKED_PROFILES_QUERY_KEY, viewerProfileId] as const;
  const query = useQuery({
    queryKey,
    queryFn: fetchBlockedProfiles,
    enabled: canLoad,
    retry: false,
  });

  return (
    <section
      aria-label={t(locale, "contentModeration.preferences.blockedTitle")}
      className="tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-5 tw-py-5 sm:tw-px-6"
    >
      <p className="tw-m-0 tw-text-sm tw-text-iron-400">
        {t(locale, "contentModeration.preferences.description")}
      </p>
      {!canLoad && (
        <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-iron-400">
          {t(locale, "contentModeration.preferences.signIn")}
        </p>
      )}
      {canLoad && query.isLoading && (
        <output className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-iron-400">
          {t(locale, "contentModeration.preferences.loading")}
        </output>
      )}
      {canLoad && query.isError && (
        <p role="alert" className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-red">
          {t(locale, "contentModeration.preferences.loadError")}
        </p>
      )}
      {query.data?.length === 0 && (
        <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-iron-400">
          {t(locale, "contentModeration.preferences.empty")}
        </p>
      )}
      {viewerProfileId && (query.data?.length ?? 0) > 0 && (
        <ul className="tw-m-0 tw-mt-3 tw-list-none tw-p-0">
          {(query.data ?? []).map((profile) => (
            <BlockedProfileRow
              key={profile.profile_id}
              profile={profile}
              viewerProfileId={viewerProfileId}
              queryKey={queryKey}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
