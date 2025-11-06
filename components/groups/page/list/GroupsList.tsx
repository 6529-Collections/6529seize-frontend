"use client";

import { useEffect, useState } from "react";
import { GroupsRequestParams } from "@/entities/IGroup";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { Mutable, NonNullableNotRequired } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import GroupCard from "./card/GroupCard";
import GroupsListSearch from "./search/GroupsListSearch";
import CommonInfiniteScrollWrapper from "@/components/utils/infinite-scroll/CommonInfiniteScrollWrapper";
import { useDebounce } from "react-use";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

const REQUEST_SIZE = 20;

export default function GroupsList({
  filters,
  showIdentitySearch,
  showCreateNewGroupButton,
  showMyGroupsButton,
  onCreateNewGroup,
  setGroupName,
  setAuthorIdentity,
  onMyGroups,
}: {
  readonly filters: GroupsRequestParams;
  readonly showIdentitySearch: boolean;
  readonly showCreateNewGroupButton: boolean;
  readonly showMyGroupsButton: boolean;
  readonly onCreateNewGroup: () => void;
  readonly setGroupName: (value: string | null) => void;
  readonly setAuthorIdentity: (value: string | null) => void;
  readonly onMyGroups: () => void;
}) {
  const [debouncedFilters, setDebouncedFilters] =
    useState<GroupsRequestParams>(filters);

  useDebounce(() => setDebouncedFilters(filters), 200, [filters]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [QueryKey.GROUPS, debouncedFilters],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Mutable<NonNullableNotRequired<GroupsRequestParams>> = {};
      if (debouncedFilters.group_name) {
        params.group_name = debouncedFilters.group_name;
      }
      if (debouncedFilters.author_identity) {
        params.author_identity = debouncedFilters.author_identity;
      }

      if (pageParam) {
        params.created_at_less_than = `${pageParam}`;
      }
      return await commonApiFetch<
        ApiGroupFull[],
        NonNullableNotRequired<GroupsRequestParams>
      >({
        endpoint: "groups",
        params,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.created_at ?? null,
    placeholderData: keepPreviousData,
  });

  const [groups, setGroups] = useState<ApiGroupFull[]>([]);

  useEffect(() => setGroups(data?.pages?.flat() ?? []), [data]);

  const onBottomIntersection = (state: boolean) => {
    if (groups.length < REQUEST_SIZE) {
      return;
    }

    if (!state) {
      return;
    }
    if (status === "pending") {
      return;
    }
    if (isFetching) {
      return;
    }
    if (isFetchingNextPage) {
      return;
    }
    if (!hasNextPage) {
      return;
    }

    fetchNextPage();
  };

  const [activeGroupIdVoteAll, setActiveGroupIdVoteAll] = useState<
    string | null
  >(null);

  return (
    <>
      <GroupsListSearch
        identity={filters.author_identity}
        groupName={filters.group_name}
        showIdentitySearch={showIdentitySearch}
        showCreateNewGroupButton={showCreateNewGroupButton}
        showMyGroupsButton={showMyGroupsButton}
        setIdentity={setAuthorIdentity}
        setGroupName={setGroupName}
        onCreateNewGroup={onCreateNewGroup}
        onMyGroups={onMyGroups}
      />
      <CommonInfiniteScrollWrapper
        loading={isFetching}
        onBottomIntersection={onBottomIntersection}>
        <div className="tw-mt-6 tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4 lg:tw-gap-5">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              activeGroupIdVoteAll={activeGroupIdVoteAll}
              setActiveGroupIdVoteAll={setActiveGroupIdVoteAll}
            />
          ))}
        </div>
      </CommonInfiniteScrollWrapper>
    </>
  );
}
