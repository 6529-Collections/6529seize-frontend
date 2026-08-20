"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { fetchSavedGroupMembersPage } from "@/services/api/group-members-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function WaveRulesGroupMembersLink({
  groupId,
  groupName,
  href,
  linkLabel,
}: {
  readonly groupId: string;
  readonly groupName: string;
  readonly href: string;
  readonly linkLabel?: string | undefined;
}) {
  const locale = useBrowserLocale();
  const { data, isError, isLoading } = useQuery({
    queryKey: [
      QueryKey.COMMUNITY_MEMBERS_TOP,
      "group-members-preview-count",
      "saved",
      groupId,
    ],
    queryFn: async ({ signal }) =>
      await fetchSavedGroupMembersPage({
        groupId,
        params: { page: 1, pageSize: 1 },
        signal,
      }),
    placeholderData: keepPreviousData,
  });

  let countLabel = t(locale, "waves.create.groups.members.countLoading");
  if (typeof data?.count === "number") {
    countLabel = t(locale, "waves.create.groups.members.currentCount", {
      count: formatInteger(locale, data.count),
    });
  } else if (isError) {
    countLabel = t(locale, "waves.create.groups.members.countUnavailable");
  }

  return (
    <Link
      href={href}
      aria-label={linkLabel ? `${linkLabel}: ${countLabel}` : countLabel}
      title={groupName}
      className="tw-inline-flex tw-min-h-11 tw-max-w-full tw-cursor-pointer tw-items-center tw-justify-end tw-break-words tw-rounded-md tw-text-right tw-text-iron-50 tw-underline tw-underline-offset-2 tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-primary-300 desktop-hover:hover:tw-decoration-2 sm:tw-min-h-9"
    >
      {isLoading ? (
        <span className="tw-h-4 tw-w-28 tw-animate-pulse tw-rounded tw-bg-iron-700 motion-reduce:tw-animate-none">
          <span className="tw-sr-only">{countLabel}</span>
        </span>
      ) : (
        countLabel
      )}
    </Link>
  );
}
