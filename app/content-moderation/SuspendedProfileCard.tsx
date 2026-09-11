"use client";

import { useAuth } from "@/components/auth/Auth";
import type { ApiContentModerationProfileListItem } from "@/generated/models/ApiContentModerationProfileListItem";
import type { ApiContentModerationProfileStatusResponse } from "@/generated/models/ApiContentModerationProfileStatusResponse";
import { ApiModeratedProfileStatus } from "@/generated/models/ApiModeratedProfileStatus";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { CONTENT_MODERATOR_ACCESS_QUERY_KEY } from "@/hooks/content-moderation/useContentModeratorAccess";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { setModeratedProfileStatus } from "@/services/api/content-moderation-api";
import {
  PUBLIC_PROFILE_MODERATION_STATUS_QUERY_KEY,
  SUSPENDED_MODERATION_PROFILES_QUERY_KEY,
} from "@/services/content-moderation/content-moderation-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  formatTimestamp,
  getSafeAssetUrl,
} from "./content-moderation-page.helpers";

export default function SuspendedProfileCard({
  profile,
}: {
  readonly profile: ApiContentModerationProfileListItem;
}) {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const pfp = getSafeAssetUrl(profile.pfp);
  const label = profile.handle ?? profile.profile_id;
  const updatedAt = formatTimestamp(profile.updated_at, locale);
  const mutation = useMutation({
    mutationFn: () =>
      setModeratedProfileStatus(profile.profile_id, {
        status: ApiModeratedProfileStatus.Active,
        reason: null,
      }),
    onSuccess: (response) => {
      queryClient.setQueryData<ApiContentModerationProfileStatusResponse>(
        [...PUBLIC_PROFILE_MODERATION_STATUS_QUERY_KEY, profile.profile_id],
        response
      );
      void queryClient.invalidateQueries({
        queryKey: SUSPENDED_MODERATION_PROFILES_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: CONTENT_MODERATOR_ACCESS_QUERY_KEY,
      });
      setToast({
        message: t(locale, "contentModeration.moderator.profileSuccess"),
        type: "success",
      });
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: t(locale, "contentModeration.moderator.profileError"),
        description: t(locale, "contentModeration.error.retry"),
        details: getToastErrorDetails(error),
      });
    },
  });

  return (
    <article className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 tw-rounded-xl tw-bg-iron-950 tw-p-4">
      {pfp ? (
        <Image
          src={pfp}
          alt=""
          width={44}
          height={44}
          className="tw-size-11 tw-rounded-lg tw-object-cover"
        />
      ) : (
        <span className="tw-size-11 tw-rounded-lg tw-bg-iron-800" />
      )}
      <div className="tw-min-w-0 tw-flex-1">
        {profile.handle ? (
          <Link
            href={`/${profile.handle}`}
            className="tw-font-semibold tw-text-iron-50 tw-no-underline hover:tw-text-primary-300"
          >
            {label}
          </Link>
        ) : (
          <span className="tw-font-semibold tw-text-iron-50">{label}</span>
        )}
        <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-300">
          {[profile.reason, updatedAt].filter(Boolean).join(" · ")}
        </p>
      </div>
      {confirming ? (
        <div className="tw-flex tw-items-center tw-gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-2 tw-text-sm tw-font-semibold tw-text-iron-300 hover:tw-text-white"
          >
            {t(locale, "contentModeration.report.cancel")}
          </button>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="tw-cursor-pointer tw-rounded-lg tw-border-0 tw-bg-iron-100 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-black hover:tw-bg-white disabled:tw-cursor-default disabled:tw-opacity-50"
          >
            {t(locale, "contentModeration.moderator.confirm")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-bg-iron-800"
        >
          {t(locale, "contentModeration.moderator.reinstate")}
        </button>
      )}
    </article>
  );
}
