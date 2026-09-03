"use client";

import {
  type ApiContentModerationBlockActivityItem,
  ApiContentModerationBlockActivityItemActionEnum,
} from "@/generated/models/ApiContentModerationBlockActivityItem";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { tRich } from "@/i18n/messages";
import Image from "next/image";
import Link from "next/link";
import { Children, type ReactElement } from "react";
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
          width={28}
          height={28}
          className="tw-size-7 tw-flex-none tw-rounded-md tw-bg-iron-800 tw-object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="tw-size-7 tw-flex-none tw-rounded-md tw-bg-iron-800"
        />
      )}
      <span className="tw-min-w-0 tw-truncate tw-font-semibold">{label}</span>
    </>
  );

  return handle ? (
    <Link
      href={`/${handle}`}
      className="tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-center tw-gap-2 tw-text-iron-50 tw-no-underline hover:tw-text-primary-300 focus-visible:tw-rounded-md focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-max-w-64"
    >
      {content}
    </Link>
  ) : (
    <span className="tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-center tw-gap-2 tw-text-iron-50 sm:tw-max-w-64">
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
    item.action === ApiContentModerationBlockActivityItemActionEnum.Unblocked
      ? "contentModeration.moderator.blockActivity.unblockedSummary"
      : "contentModeration.moderator.blockActivity.summary",
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
    <li className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-6 tw-gap-y-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-3 tw-py-3">
      <div className="tw-flex tw-min-w-0 tw-max-w-full tw-flex-1 tw-basis-80 tw-items-center tw-gap-x-3 tw-text-sm tw-font-medium tw-text-iron-400">
        {Children.map(relationship, (part) =>
          typeof part === "string" ? (
            <span className="tw-flex-none tw-whitespace-pre-wrap">{part}</span>
          ) : (
            part
          )
        )}
      </div>{" "}
      {timestamp && (
        <time
          dateTime={new Date(item.created_at).toISOString()}
          className="tw-ml-auto tw-flex-none tw-whitespace-nowrap tw-text-xs tw-text-iron-400"
        >
          {timestamp}
        </time>
      )}
    </li>
  );
}
