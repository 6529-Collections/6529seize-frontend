"use client";

import type { ApiContentModerationBlockActivityItem } from "@/generated/models/ApiContentModerationBlockActivityItem";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { tRich } from "@/i18n/messages";
import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";
import {
  formatTimestamp,
  getSafeAssetUrl,
} from "./content-moderation-page.helpers";

function ProfileIdentity({
  profileId,
  handle,
  pfp,
}: {
  readonly profileId: string;
  readonly handle: string | null;
  readonly pfp: string | null;
}) {
  const safePfp = getSafeAssetUrl(pfp);
  const label = handle ? `@${handle}` : profileId;
  const content = (
    <>
      {safePfp ? (
        <Image
          src={safePfp}
          alt=""
          width={36}
          height={36}
          className="tw-size-9 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="tw-size-9 tw-flex-none tw-rounded-lg tw-bg-iron-800"
        />
      )}
      <span className="tw-min-w-0 tw-truncate tw-font-semibold">{label}</span>
    </>
  );

  return handle ? (
    <Link
      href={`/${handle}`}
      className="tw-inline-flex tw-min-w-0 tw-items-center tw-gap-2.5 tw-text-iron-50 tw-no-underline hover:tw-text-primary-300 focus-visible:tw-rounded-md focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
    >
      {content}
    </Link>
  ) : (
    <span className="tw-inline-flex tw-min-w-0 tw-items-center tw-gap-2.5 tw-text-iron-50">
      {content}
    </span>
  );
}

export default function BlockActivityCard({
  item,
}: {
  readonly item: ApiContentModerationBlockActivityItem;
}) {
  const locale = useBrowserLocale();
  const timestamp = formatTimestamp(item.created_at, locale);
  const relationship = tRich<ReactElement>(
    locale,
    "contentModeration.moderator.blockActivity.summary",
    {
      blocker: (
        <ProfileIdentity
          key="blocker"
          profileId={item.blocker_profile_id}
          handle={item.blocker_handle}
          pfp={item.blocker_pfp}
        />
      ),
      blocked: (
        <ProfileIdentity
          key="blocked"
          profileId={item.blocked_profile_id}
          handle={item.blocked_handle}
          pfp={item.blocked_pfp}
        />
      ),
    }
  );

  return (
    <article
      role="listitem"
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 sm:tw-p-5"
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-y-3 tw-text-sm tw-font-medium tw-text-iron-400">
        {relationship}
      </div>
      {timestamp && (
        <time
          dateTime={new Date(item.created_at).toISOString()}
          className="tw-mt-3 tw-block tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-3 tw-text-xs tw-text-iron-400"
        >
          {timestamp}
        </time>
      )}
    </article>
  );
}
