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
import { setProfileBlockedOverride } from "@/services/content-moderation/content-moderation-state";
import {
  BLOCKED_PROFILES_QUERY_KEY,
  invalidateContentModerationPresentation,
} from "@/services/content-moderation/content-moderation-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

function BlockedProfileRow({
  profile,
}: {
  readonly profile: ApiBlockedProfile;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, setToast } = useAuth();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => unblockProfile(profile.profile_id),
    onSuccess: () => {
      if (connectedProfile?.id) {
        setProfileBlockedOverride(
          connectedProfile.id,
          profile.profile_id,
          false
        );
      }
      void queryClient.invalidateQueries({
        queryKey: BLOCKED_PROFILES_QUERY_KEY,
      });
      void invalidateContentModerationPresentation(queryClient);
      setToast({
        message: t(locale, "contentModeration.unblock.success"),
        type: "success",
      });
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: t(locale, "contentModeration.unblock.error"),
        description: t(locale, "contentModeration.error.retry"),
        details: getToastErrorDetails(error),
      });
    },
  });

  return (
    <li className="tw-flex tw-items-center tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4 last:tw-border-b-0">
      <div className="tw-relative tw-size-10 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800">
        {profile.pfp && (
          <Image
            src={resolveIpfsUrlSync(profile.pfp)}
            alt=""
            fill
            sizes="40px"
            className="tw-object-cover"
          />
        )}
      </div>
      <div className="tw-min-w-0 tw-flex-1">
        <p className="tw-m-0 tw-truncate tw-font-semibold tw-text-iron-100">
          {profile.handle ?? profile.profile_id}
        </p>
      </div>
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

export default function ContentPreferencesPageClient() {
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const canLoad = Boolean(connectedProfile?.id) && activeProfileProxy === null;
  const query = useQuery({
    queryKey: [...BLOCKED_PROFILES_QUERY_KEY, connectedProfile?.id ?? null],
    queryFn: fetchBlockedProfiles,
    enabled: canLoad,
    retry: false,
  });

  return (
    <main className="tailwind-scope tw-mx-auto tw-w-full tw-max-w-3xl tw-px-4 tw-py-8 sm:tw-px-6 sm:tw-py-12">
      <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-tracking-tight tw-text-iron-50">
        {t(locale, "contentModeration.preferences.title")}
      </h1>
      <p className="tw-mb-0 tw-mt-3 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-400">
        {t(locale, "contentModeration.preferences.description")}
      </p>

      <section
        aria-labelledby="blocked-profiles-heading"
        className="tw-mt-8 tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-5 tw-py-5"
      >
        <h2
          id="blocked-profiles-heading"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-100"
        >
          {t(locale, "contentModeration.preferences.blockedTitle")}
        </h2>
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
        {(query.data?.length ?? 0) > 0 && (
          <ul className="tw-m-0 tw-mt-3 tw-list-none tw-p-0">
            {(query.data ?? []).map((profile) => (
              <BlockedProfileRow key={profile.profile_id} profile={profile} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
