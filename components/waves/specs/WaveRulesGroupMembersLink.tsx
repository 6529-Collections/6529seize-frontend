"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useGroupCriteriaIdentityLabels } from "@/hooks/useGroupCriteriaIdentityLabels";
import { t } from "@/i18n/messages";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { getGroupCriteriaSummary } from "@/helpers/groups/group-criteria-summary";
import { formatGroupMembersCount } from "@/helpers/groups/group-members-count";
import { commonApiFetch } from "@/services/api/common-api";
import { fetchSavedGroupMembersPage } from "@/services/api/group-members-api";
import { useQuery } from "@tanstack/react-query";
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
  const {
    data: members,
    isError: isMembersError,
    isLoading: areMembersLoading,
  } = useQuery({
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
    enabled: groupId.length > 0,
  });
  const {
    data: group,
    isError: isGroupError,
    isLoading: isGroupLoading,
  } = useQuery<ApiGroupFull>({
    queryKey: [QueryKey.GROUP, groupId],
    queryFn: async ({ signal }) =>
      await commonApiFetch<ApiGroupFull>({
        endpoint: `groups/${encodeURIComponent(groupId)}`,
        signal,
      }),
    enabled: groupId.length > 0,
    staleTime: 60_000,
  });
  const identityLabels = useGroupCriteriaIdentityLabels(group?.group);

  let countLabel = t(locale, "waves.create.groups.members.countLoading");
  if (typeof members?.count === "number") {
    countLabel = formatGroupMembersCount({ count: members.count, locale });
  } else if (isMembersError) {
    countLabel = t(locale, "waves.create.groups.members.countUnavailable");
  }

  const criteria = getGroupCriteriaSummary({
    group: group?.group,
    identityLabels,
    locale,
  });
  let criteriaLabel =
    criteria.text ?? t(locale, "waves.create.groups.members.noCriteria");
  if (isGroupLoading) {
    criteriaLabel = t(locale, "waves.create.groups.members.criteria.loading");
  } else if (isGroupError || criteria.status === "unavailable") {
    criteriaLabel = t(
      locale,
      "waves.create.groups.members.criteria.unavailable"
    );
  }

  return (
    <div className="tw-flex tw-max-w-full tw-flex-col tw-items-end tw-gap-1">
      <Link
        href={href}
        aria-label={linkLabel ? `${linkLabel}: ${countLabel}` : countLabel}
        title={groupName}
        className="tw-inline-flex tw-min-h-11 tw-max-w-full tw-cursor-pointer tw-items-center tw-justify-end tw-break-words tw-rounded-md tw-text-right tw-text-iron-50 tw-underline tw-underline-offset-2 tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-primary-300 desktop-hover:hover:tw-decoration-2 sm:tw-min-h-9"
      >
        {areMembersLoading ? (
          <span className="tw-h-4 tw-w-28 tw-animate-pulse tw-rounded tw-bg-iron-700 motion-reduce:tw-animate-none">
            <span className="tw-sr-only">{countLabel}</span>
          </span>
        ) : (
          countLabel
        )}
      </Link>
      <p
        aria-live="polite"
        className="tw-mb-0 tw-max-w-xl tw-break-words tw-text-right tw-text-xs tw-font-normal tw-leading-4 tw-text-iron-500"
      >
        {criteriaLabel}
      </p>
    </div>
  );
}
