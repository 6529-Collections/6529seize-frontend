"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import GroupItem from "./item/GroupItem";
import type { ApiCommunityMemberOverview } from "@/generated/models/ApiCommunityMemberOverview";
import type { Page } from "@/helpers/Types";
import type { CommunityMembersQuery } from "@/app/network/page";
import { SortDirection } from "@/entities/ISort";
import { useEffect, useState } from "react";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { useDispatch } from "react-redux";
import { setActiveGroupId } from "@/store/groupSlice";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { GroupSelectVariant } from "./groupSelect.types";
import { UsersIcon } from "@heroicons/react/24/outline";

export default function GroupsSelectActiveGroup({
  activeGroupId,
  variant = "default",
}: {
  readonly activeGroupId: string;
  readonly variant?: GroupSelectVariant | undefined;
}) {
  const isMobileSheet = variant === "mobile-sheet";
  const { data } = useQuery<ApiGroupFull>({
    queryKey: [QueryKey.GROUP, activeGroupId],
    queryFn: async () =>
      await commonApiFetch<ApiGroupFull>({
        endpoint: `groups/${activeGroupId}`,
      }),
    placeholderData: keepPreviousData,
  });

  const { data: members } = useQuery<Page<ApiCommunityMemberOverview>>({
    queryKey: [
      QueryKey.COMMUNITY_MEMBERS_TOP,
      {
        page: 1,
        pageSize: 1,
        sort: ApiCommunityMembersSortOption.Level,
        sortDirection: SortDirection.DESC,
        groupId: activeGroupId,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<
        Page<ApiCommunityMemberOverview>,
        CommunityMembersQuery
      >({
        endpoint: `community-members/top`,
        params: {
          page: 1,
          page_size: 1,
          sort: ApiCommunityMembersSortOption.Level,
          sort_direction: SortDirection.DESC,
          group_id: activeGroupId,
        },
      }),
    placeholderData: keepPreviousData,
    enabled: !!activeGroupId,
  });

  const [membersCount, setMembersCount] = useState<number | null>(null);

  useEffect(() => {
    if (members) {
      setMembersCount(members.count);
    }
  }, [members]);

  const dispatch = useDispatch();

  const onActiveGroupId = (groupId: string | null) => {
    dispatch(setActiveGroupId(groupId));
  };

  if (!data) {
    return (
      <div
        className={
          isMobileSheet
            ? "tw-px-4 tw-pt-4 tw-text-sm tw-font-medium tw-text-iron-400"
            : "tw-px-4 tw-text-md tw-font-normal tw-text-iron-400"
        }
      >
        Loading...
      </div>
    );
  }

  if (isMobileSheet) {
    return (
      <div className="tw-px-4 tw-pt-4">
        <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between tw-gap-3">
          <p className="tw-mb-0 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-iron-400">
            Active filter
          </p>
          {typeof membersCount === "number" && (
            <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-bold tw-text-iron-400">
              <UsersIcon className="tw-size-3 tw-text-iron-400" />
              {membersCount}
            </span>
          )}
        </div>
        <GroupItem
          key={data.id}
          group={data}
          activeGroupId={activeGroupId}
          onActiveGroupId={onActiveGroupId}
          variant={variant}
        />
      </div>
    );
  }

  return (
    <div className="tw-px-4 tw-pt-4">
      {typeof membersCount === "number" && (
        <div className="tw-mb-3 tw-flex tw-items-center tw-gap-x-2">
          <UsersIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-200" />
          <p className="tw-mb-0 tw-whitespace-nowrap tw-text-xs tw-font-normal tw-text-iron-400">
            Members:{" "}
            <span className="tw-pl-1.5 tw-font-medium tw-text-iron-50">
              {membersCount}
            </span>
          </p>
        </div>
      )}

      <GroupItem
        key={data.id}
        group={data}
        activeGroupId={activeGroupId}
        onActiveGroupId={onActiveGroupId}
        variant={variant}
      />
    </div>
  );
}
