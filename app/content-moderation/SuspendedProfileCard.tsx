"use client";

import type { ApiContentModerationProfileListItem } from "@/generated/models/ApiContentModerationProfileListItem";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

import Image from "next/image";
import Link from "next/link";
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
  const pfp = getSafeAssetUrl(profile.pfp);
  const label = profile.handle ?? profile.profile_id;
  const updatedAt = formatTimestamp(profile.updated_at, locale);
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
      <Link
        href={`/content-moderation/checks?profile=${encodeURIComponent(profile.profile_id)}`}
        prefetch={false}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(locale, "checks.reportReview")}
      </Link>
    </article>
  );
}
