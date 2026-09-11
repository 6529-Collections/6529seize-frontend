"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  MagnifyingGlassIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useId, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import UserLevel from "@/components/user/utils/level/UserLevel";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import Button from "@/components/utils/button/Button";
import GroupCardConfigs from "@/components/groups/page/list/card/GroupCardConfigs";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiCommunityMemberOverview } from "@/generated/models/ApiCommunityMemberOverview";
import type { ApiCommunityMembersPage } from "@/generated/models/ApiCommunityMembersPage";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { formatGroupMembersCount } from "@/helpers/groups/group-members-count";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  fetchGroupMembersPage,
  GROUP_MEMBERS_SEARCH_MAX_LENGTH,
  getGroupMembersTargetKey,
  getGroupMembersTargetName,
  type GroupMembersPreviewTarget,
} from "@/services/api/group-members-api";

const PAGE_SIZE = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasRenderableSavedGroupCriteria(group: ApiGroupFull): boolean {
  const criteria = (group as { readonly group?: unknown }).group;
  if (!isRecord(criteria)) {
    return false;
  }

  return (
    isRecord(criteria["tdh"]) &&
    isRecord(criteria["rep"]) &&
    isRecord(criteria["cic"]) &&
    isRecord(criteria["level"]) &&
    Array.isArray(criteria["owns_nfts"]) &&
    typeof criteria["identity_group_identities_count"] === "number"
  );
}

function MemberMetric({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}) {
  const locale = useBrowserLocale();
  return (
    <span className="tw-inline-flex tw-items-baseline tw-gap-1 tw-whitespace-nowrap">
      <span className="tw-text-xs tw-font-semibold tw-tabular-nums tw-text-iron-100">
        {formatInteger(locale, value)}
      </span>
      <span className="tw-text-[0.65rem] tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
        {label}
      </span>
    </span>
  );
}

function MemberRow({
  member,
}: {
  readonly member: ApiCommunityMemberOverview;
}) {
  const locale = useBrowserLocale();
  return (
    <li className="tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/60 tw-p-3">
      <div className="tw-flex tw-items-start tw-gap-3">
        <ProfileAvatar
          pfpUrl={member.pfp}
          size={ProfileBadgeSize.MEDIUM}
          alt=""
          fallbackContent={
            <UserIcon
              aria-hidden="true"
              className="tw-size-5 tw-text-iron-500"
            />
          }
        />
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2">
            <Link
              href={`/${member.detail_view_key}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t(locale, "waves.create.groups.members.openProfile", {
                identity: member.display,
              })}
              className="tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-50 tw-no-underline tw-transition-colors focus-visible:tw-rounded-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-primary-300"
            >
              {member.display}
            </Link>
            <UserLevel level={member.level} size="xxs" asSpan />
          </div>
          {member.display.toLowerCase() !== member.wallet.toLowerCase() ? (
            <p
              title={member.wallet}
              className="tw-m-0 tw-mt-1 tw-truncate tw-font-mono tw-text-[0.6875rem] tw-text-iron-500"
            >
              {member.wallet}
            </p>
          ) : null}
          <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1.5">
            <MemberMetric label="TDH" value={member.combined_tdh} />
            <MemberMetric label="REP" value={member.rep} />
            <MemberMetric label="NIC" value={member.cic} />
          </div>
        </div>
      </div>
    </li>
  );
}

function MembersSkeleton() {
  const locale = useBrowserLocale();
  return (
    <output
      className="tw-flex tw-flex-col tw-gap-2"
      aria-label={t(locale, "waves.create.groups.members.loadingStatus")}
    >
      {[0, 1, 2, 3].map((item) => (
        <span
          key={item}
          className="tw-block tw-h-[5.75rem] tw-animate-pulse tw-rounded-lg tw-bg-iron-900 motion-reduce:tw-animate-none"
        />
      ))}
    </output>
  );
}

function MembersCriteria({
  target,
  unavailableMessage,
}: {
  readonly target: GroupMembersPreviewTarget;
  readonly unavailableMessage: string;
}) {
  if (target.kind === "draft") {
    return (
      <p className="tw-m-0 tw-text-sm tw-text-iron-400">{target.summary}</p>
    );
  }

  if (!hasRenderableSavedGroupCriteria(target.group)) {
    return (
      <p className="tw-m-0 tw-text-sm tw-text-iron-400">{unavailableMessage}</p>
    );
  }

  return <GroupCardConfigs group={target.group} />;
}

function MembersResults({
  data,
  emptyMessage,
  isError,
  isFetching,
  onRetry,
  showSkeleton,
}: {
  readonly data: ApiCommunityMembersPage | undefined;
  readonly emptyMessage: string;
  readonly isError: boolean;
  readonly isFetching: boolean;
  readonly onRetry: () => void;
  readonly showSkeleton: boolean;
}) {
  const locale = useBrowserLocale();

  if (showSkeleton) {
    return <MembersSkeleton />;
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="tw-flex tw-flex-col tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-error/40 tw-bg-error/5 tw-p-4"
      >
        <div>
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            {t(locale, "waves.create.groups.members.errorTitle")}
          </p>
          <p className="tw-m-0 tw-mt-1 tw-text-xs tw-text-iron-400">
            {t(locale, "waves.create.groups.members.errorDescription")}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t(locale, "waves.create.groups.members.retry")}
        </Button>
      </div>
    );
  }

  if (data === undefined) {
    return null;
  }

  if (data.data.length === 0) {
    return (
      <p className="tw-m-0 tw-rounded-lg tw-border tw-border-dashed tw-border-iron-700 tw-p-6 tw-text-center tw-text-sm tw-text-iron-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul
      aria-busy={isFetching}
      aria-label={t(locale, "waves.create.groups.members.listLabel")}
      className={`tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0 tw-transition-opacity ${
        isFetching ? "tw-opacity-60" : "tw-opacity-100"
      }`}
    >
      {data.data.map((member) => (
        <MemberRow
          key={`${member.detail_view_key}-${member.wallet}`}
          member={member}
        />
      ))}
    </ul>
  );
}

export default function GroupMembersPreviewDialog({
  target,
  roleLabel,
  onClose,
}: {
  readonly target: GroupMembersPreviewTarget;
  readonly roleLabel: string;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const searchInputId = useId();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const commitSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value.trim());
    setPage(1);
  }, 250);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: [
      QueryKey.COMMUNITY_MEMBERS_TOP,
      "group-members-preview",
      ...getGroupMembersTargetKey(target),
      page,
      debouncedSearch,
    ],
    queryFn: async ({ signal }) =>
      await fetchGroupMembersPage({
        target,
        params: {
          page,
          pageSize: PAGE_SIZE,
          param: debouncedSearch || undefined,
        },
        signal,
      }),
    placeholderData: keepPreviousData,
  });

  const targetName = getGroupMembersTargetName(target);
  const groupName =
    typeof targetName === "string" && targetName.trim().length > 0
      ? targetName
      : t(locale, "waves.create.groups.selectedGroup");
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));
  const hasMembers = (data?.data.length ?? 0) > 0;
  const showSkeleton = !hasMembers && (isLoading || isFetching);
  const emptyMessage =
    debouncedSearch.length > 0
      ? t(locale, "waves.create.groups.members.searchEmpty")
      : t(locale, "waves.create.groups.members.empty");

  return (
    <MobileWrapperDialog
      title={t(locale, "waves.create.groups.members.dialogTitle", {
        role: roleLabel,
        group: groupName,
      })}
      isOpen
      onClose={onClose}
      tall
      fixedHeight
      tabletModal
      noPadding
      zIndexClassName="tw-z-[10000]"
      showHeaderCloseButton
      enableDragToClose
      maxWidthClass="md:tw-max-w-2xl"
      surfaceClassName="tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-shadow-2xl tw-shadow-black/60"
      titleClassName="tw-text-base !tw-font-bold !tw-text-white tw-tracking-tight"
      headerClassName="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-px-4 tw-pb-3 tw-pt-4 sm:tw-px-5"
    >
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-px-4 tw-pb-2 sm:tw-px-5">
        <div className="tw-flex-shrink-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-pb-4 tw-pt-4">
          <p className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-400">
            {t(locale, "waves.create.groups.members.dynamicDescription")}
          </p>
          <details className="tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/50 tw-px-3 tw-py-2.5">
            <summary className="tw-cursor-pointer tw-text-xs tw-font-semibold tw-text-iron-300 marker:tw-text-iron-500">
              {t(locale, "waves.create.groups.members.criteriaSummary")}
            </summary>
            <div className="tw-mt-3">
              <MembersCriteria
                target={target}
                unavailableMessage={t(
                  locale,
                  "waves.create.groups.members.criteriaUnavailable"
                )}
              />
            </div>
          </details>
          <label
            htmlFor={searchInputId}
            className="tw-mb-1.5 tw-mt-4 tw-block tw-text-xs tw-font-semibold tw-text-iron-300"
          >
            {t(locale, "waves.create.groups.members.searchLabel")}
          </label>
          <div className="tw-relative">
            <MagnifyingGlassIcon
              aria-hidden="true"
              className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-1/2 tw-size-4 -tw-translate-y-1/2 tw-text-iron-500"
            />
            <input
              id={searchInputId}
              type="search"
              maxLength={GROUP_MEMBERS_SEARCH_MAX_LENGTH}
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                setSearch(value);
                commitSearch(value);
              }}
              placeholder={t(
                locale,
                "waves.create.groups.members.searchPlaceholder"
              )}
              className="tw-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-py-2 tw-pl-9 tw-pr-10 tw-text-sm tw-text-iron-100 tw-outline-none placeholder:tw-text-iron-500 focus:tw-border-primary-500 focus:tw-ring-1 focus:tw-ring-primary-500"
            />
            {search.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  commitSearch("");
                  commitSearch.flush();
                }}
                aria-label={t(
                  locale,
                  "waves.create.groups.members.clearSearch"
                )}
                className="tw-absolute tw-right-1.5 tw-top-1/2 tw-flex tw-size-8 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200"
              >
                <XMarkIcon aria-hidden="true" className="tw-size-4" />
              </button>
            ) : null}
          </div>
          <p
            aria-live="polite"
            className="tw-m-0 tw-mt-3 tw-text-xs tw-font-medium tw-text-iron-400"
          >
            {typeof data?.count === "number"
              ? formatGroupMembersCount({ count: data.count, locale })
              : t(locale, "waves.create.groups.members.countLoading")}
          </p>
        </div>

        <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-py-4">
          <MembersResults
            data={data}
            emptyMessage={emptyMessage}
            isError={isError}
            isFetching={isFetching}
            onRetry={() => void refetch()}
            showSkeleton={showSkeleton}
          />
        </div>

        {data !== undefined && totalPages > 1 ? (
          <CommonTablePagination
            currentPage={page}
            setCurrentPage={setPage}
            totalPages={totalPages}
            haveNextPage={data.next}
            small={false}
            loading={isFetching}
            className="tw-flex-shrink-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5"
          />
        ) : null}
      </div>
    </MobileWrapperDialog>
  );
}
