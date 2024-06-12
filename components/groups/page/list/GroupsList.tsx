import { useEffect, useState } from "react";
import { GroupsRequestParams } from "../../../../entities/IGroup";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { GroupFull } from "../../../../generated/models/GroupFull";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { Mutable, NonNullableNotRequired } from "../../../../helpers/Types";
import { commonApiFetch } from "../../../../services/api/common-api";
import GroupCard from "./card/GroupCard";
import GroupsListSearch from "./search/GroupsListSearch";
import { useDebounce } from "react-use";
import CommonInfiniteScrollWrapper from "../../../utils/infinite-scroll/CommonInfiniteScrollWrapper";
import { useRouter } from "next/router";
import { usePathname, useSearchParams } from "next/navigation";

const REQUEST_SIZE = 20;
const IDENTITY_SEARCH_PARAM = "identity";
const GROUP_NAME_SEARCH_PARAM = "group";

export default function GroupsList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const identity = searchParams.get(IDENTITY_SEARCH_PARAM);
  const group = searchParams.get(GROUP_NAME_SEARCH_PARAM);

  const [filters, setFilters] = useState<GroupsRequestParams>({
    group_name: group,
    author_identity: identity,
  });

  useEffect(() => {
    setFilters({
      group_name: group,
      author_identity: identity,
    });
  }, [group, identity]);

  const createQueryString = (
    config: {
      name: string;
      value: string | null;
    }[]
  ): string => {
    const params = new URLSearchParams(searchParams.toString());
    for (const { name, value } of config) {
      if (!value) {
        params.delete(name);
      } else {
        params.set(name, value);
      }
    }
    return params.toString();
  };

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
        GroupFull[],
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

  const setGroupName = (value: string | null) => {
    router.replace(
      pathname +
        "?" +
        createQueryString([
          {
            name: GROUP_NAME_SEARCH_PARAM,
            value,
          },
        ]),
      undefined,
      { shallow: true }
    );
  };

  const setAuthorIdentity = (value: string | null) => {
    router.replace(
      pathname +
        "?" +
        createQueryString([
          {
            name: IDENTITY_SEARCH_PARAM,
            value,
          },
        ]),
      undefined,
      { shallow: true }
    );
  };

  const [groups, setGroups] = useState<GroupFull[]>([]);

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

  return (
    <>
      <GroupsListSearch
        identity={filters.author_identity}
        groupName={filters.group_name}
        setIdentity={setAuthorIdentity}
        setGroupName={setGroupName}
      />
      <CommonInfiniteScrollWrapper
        loading={isFetching}
        onBottomIntersection={onBottomIntersection}
      >
        <div className="tw-mt-4 lg:tw-mt-6 tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-5 lg:tw-gap-6">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      </CommonInfiniteScrollWrapper>
    </>
  );
}
