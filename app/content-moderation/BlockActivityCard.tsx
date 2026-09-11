"use client";

import {
  type ApiContentModerationBlockActivityItem,
  ApiContentModerationBlockActivityItemActionEnum,
} from "@/generated/models/ApiContentModerationBlockActivityItem";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
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
      <span className="tw-min-w-0 tw-font-semibold [overflow-wrap:anywhere]">
        {label}
      </span>
    </>
  );

  return handle ? (
    <Link
      href={`/${handle}`}
      className="tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-2 tw-text-iron-50 tw-no-underline hover:tw-text-primary-300 focus-visible:tw-rounded-md focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 @[32rem]:tw-flex-row @[32rem]:tw-items-center"
    >
      {content}
    </Link>
  ) : (
    <span className="tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-2 tw-text-iron-50 @[32rem]:tw-flex-row @[32rem]:tw-items-center">
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
  const isUnblock =
    item.action === ApiContentModerationBlockActivityItemActionEnum.Unblocked;
  const LockIcon = isUnblock ? LockOpenIcon : LockClosedIcon;

  return (
    <li className="tw-grid tw-grid-cols-[minmax(0,1fr)_7.5rem_minmax(0,1fr)] tw-items-center tw-gap-x-3 tw-gap-y-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-3 tw-py-3 tw-text-sm @[32rem]:tw-gap-x-6 @[48rem]:tw-grid-cols-[minmax(0,1fr)_7.5rem_minmax(0,1fr)_10.5rem]">
      <ProfileIdentity
        profileId={item.blocker_profile_id}
        handle={item.blocker_handle}
        pfp={item.blocker_pfp}
      />{" "}
      <span
        className={`tw-grid tw-grid-cols-[minmax(0,1fr)_1.25rem] tw-items-center tw-gap-2 tw-font-semibold ${isUnblock ? "tw-text-green" : "tw-text-red"}`}
      >
        {t(
          locale,
          isUnblock
            ? "contentModeration.moderator.blockActivity.unblocked"
            : "contentModeration.moderator.blockActivity.blocked"
        )}
        <LockIcon aria-hidden="true" className="tw-size-5 tw-flex-none" />
      </span>{" "}
      <ProfileIdentity
        profileId={item.blocked_profile_id}
        handle={item.blocked_handle}
        pfp={item.blocked_pfp}
      />{" "}
      {timestamp && (
        <time
          dateTime={new Date(item.created_at).toISOString()}
          className="tw-col-span-3 tw-justify-self-end tw-whitespace-nowrap tw-text-xs tw-text-iron-400 @[48rem]:tw-col-span-1"
        >
          {timestamp}
        </time>
      )}
    </li>
  );
}
