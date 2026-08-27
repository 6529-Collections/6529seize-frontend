"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { UsersIcon } from "@heroicons/react/24/outline";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useGroupCriteriaIdentityLabels } from "@/hooks/useGroupCriteriaIdentityLabels";
import { t } from "@/i18n/messages";
import { getGroupCriteriaSummary } from "@/helpers/groups/group-criteria-summary";
import { formatGroupMembersCount } from "@/helpers/groups/group-members-count";
import {
  fetchGroupMembersPage,
  getGroupMembersTargetKey,
  type GroupMembersPreviewTarget,
} from "@/services/api/group-members-api";

export default function GroupMembersPreviewTrigger({
  target,
  disabled = false,
  appearance = "details",
  criteriaStatus,
  onOpen,
}: {
  readonly target: GroupMembersPreviewTarget;
  readonly disabled?: boolean | undefined;
  readonly appearance?: "details" | "summary" | undefined;
  readonly criteriaStatus?: "loading" | "unavailable" | undefined;
  readonly onOpen: () => void;
}) {
  const locale = useBrowserLocale();
  const savedGroupCriteria =
    target.kind === "saved" ? target.group.group : null;
  const identityLabels = useGroupCriteriaIdentityLabels(savedGroupCriteria);
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      QueryKey.COMMUNITY_MEMBERS_TOP,
      "group-members-preview-count",
      ...getGroupMembersTargetKey(target),
    ],
    queryFn: async ({ signal }) =>
      await fetchGroupMembersPage({
        target,
        params: { page: 1, pageSize: 1 },
        signal,
      }),
    placeholderData: keepPreviousData,
    enabled: true,
  });

  let countLabel = t(locale, "waves.create.groups.members.countLoading");
  if (typeof data?.count === "number") {
    countLabel = formatGroupMembersCount({ count: data.count, locale });
  } else if (isError) {
    countLabel = t(locale, "waves.create.groups.members.countUnavailable");
  }

  const savedCriteria =
    target.kind === "saved"
      ? getGroupCriteriaSummary({
          group: target.group.group,
          identityLabels,
          locale,
        })
      : null;
  let criteriaLabel =
    target.kind === "draft"
      ? target.summary
      : (savedCriteria?.text ??
        t(locale, "waves.create.groups.members.noCriteria"));
  if (criteriaStatus === "loading") {
    criteriaLabel = t(locale, "waves.create.groups.members.criteria.loading");
  } else if (
    criteriaStatus === "unavailable" ||
    savedCriteria?.status === "unavailable"
  ) {
    criteriaLabel = t(
      locale,
      "waves.create.groups.members.criteria.unavailable"
    );
  }

  if (appearance === "summary") {
    return (
      <div className="tw-flex tw-max-w-full tw-flex-col tw-items-end tw-gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={onOpen}
          aria-label={`${t(locale, "waves.create.groups.members.view")}: ${countLabel}`}
          className="desktop-hover:hover:tw-text-primary-200 tw-inline-flex tw-min-h-9 tw-max-w-full tw-cursor-pointer tw-items-center tw-justify-end tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-right tw-text-sm tw-font-medium tw-text-primary-300 tw-underline tw-underline-offset-2 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-decoration-2"
        >
          {isLoading ? (
            <span className="tw-h-4 tw-w-28 tw-animate-pulse tw-rounded tw-bg-iron-700 motion-reduce:tw-animate-none">
              <span className="tw-sr-only">{countLabel}</span>
            </span>
          ) : (
            countLabel
          )}
        </button>
        <p
          aria-live="polite"
          className="tw-mb-0 tw-max-w-xl tw-break-words tw-text-right tw-text-xs tw-font-normal tw-leading-4 tw-text-iron-500"
        >
          {criteriaLabel}
        </p>
      </div>
    );
  }

  return (
    <div className="tw-flex tw-max-w-full tw-flex-col tw-items-start tw-gap-1">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1.5">
        <span
          aria-live="polite"
          className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-text-iron-400"
        >
          <UsersIcon aria-hidden="true" className="tw-size-4" />
          {isLoading ? (
            <span className="tw-h-3 tw-w-28 tw-animate-pulse tw-rounded tw-bg-iron-700 motion-reduce:tw-animate-none">
              <span className="tw-sr-only">{countLabel}</span>
            </span>
          ) : (
            countLabel
          )}
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={onOpen}
          className="desktop-hover:hover:tw-text-primary-200 tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-primary-300 tw-underline-offset-2 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-underline"
        >
          {t(locale, "waves.create.groups.members.view")}
        </button>
      </div>
      <p
        aria-live="polite"
        className="tw-mb-0 tw-max-w-xl tw-break-words tw-text-left tw-text-xs tw-font-normal tw-leading-4 tw-text-iron-500"
      >
        {criteriaLabel}
      </p>
    </div>
  );
}
