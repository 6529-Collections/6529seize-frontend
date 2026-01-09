"use client";

import type { CommunityMembersQuery } from "@/app/network/page";
import { SortDirection } from "@/entities/ISort";
import type { ApiCommunityMemberOverview } from "@/generated/models/ApiCommunityMemberOverview";
import type { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "react-use";
import CommunityMembersMobileSortContent from "./members-table/CommunityMembersMobileSortContent";
import CommunityMembersTable from "./members-table/CommunityMembersTable";
import CommunityMembersTableSkeleton from "./members-table/CommunityMembersTableSkeleton";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import { useSetTitle } from "@/contexts/TitleContext";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import { selectActiveGroupId } from "@/store/groupSlice";
import { faArrowDownWideShort } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import GroupsSidebar from "../groups/sidebar/GroupsSidebar";
import MobileWrapperDialog from "../mobile-wrapper-dialog/MobileWrapperDialog";

interface QueryUpdateInput {
  name: keyof typeof SEARCH_PARAMS_FIELDS;
  value: string | null;
}

const SEARCH_PARAMS_FIELDS = {
  page: "page",
  sortBy: "sort-by",
  sortDirection: "sort-direction",
  group: "group",
} as const;

export default function CommunityMembers() {
  useSetTitle("Network");

  const defaultSortBy = ApiCommunityMembersSortOption.Level;
  const defaultSortDirection = SortDirection.DESC;
  const defaultPageSize = 50;
  const defaultPage = 1;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeGroupId = useSelector(selectActiveGroupId);

  const convertSortBy = useCallback(
    (sort: string | null): ApiCommunityMembersSortOption => {
      if (!sort) return defaultSortBy;
      if (
        Object.values(ApiCommunityMembersSortOption).includes(
          sort.toLowerCase() as ApiCommunityMembersSortOption
        )
      ) {
        return sort.toLowerCase() as ApiCommunityMembersSortOption;
      }
      return defaultSortBy;
    },
    [defaultSortBy]
  );

  const convertSortDirection = useCallback(
    (sortDirection: string | null): SortDirection => {
      if (!sortDirection) return defaultSortDirection;
      if (
        Object.values(SortDirection).includes(
          sortDirection.toUpperCase() as SortDirection
        )
      ) {
        return sortDirection.toUpperCase() as SortDirection;
      }
      return defaultSortDirection;
    },
    [defaultSortDirection]
  );

  const params = useMemo<CommunityMembersQuery>(() => {
    const page = parseInt(searchParams?.get(SEARCH_PARAMS_FIELDS.page) || "");
    const sortBy = searchParams?.get(SEARCH_PARAMS_FIELDS.sortBy);
    const sortDirection = searchParams?.get(SEARCH_PARAMS_FIELDS.sortDirection);
    const group = searchParams?.get(SEARCH_PARAMS_FIELDS.group);
    const query: CommunityMembersQuery = {
      page: page || defaultPage,
      page_size: defaultPageSize,
      sort: sortBy ? convertSortBy(sortBy) : defaultSortBy,
      sort_direction: sortDirection
        ? convertSortDirection(sortDirection)
        : defaultSortDirection,
    };
    if (group) {
      query.group_id = group;
    }
    return query;
  }, [
    convertSortBy,
    convertSortDirection,
    defaultPage,
    defaultPageSize,
    defaultSortBy,
    defaultSortDirection,
    searchParams,
  ]);

  const createQueryString = useCallback(
    (updateItems: QueryUpdateInput[], lowerCase: boolean = true): string => {
      const searchParamsStr = new URLSearchParams(searchParams?.toString());
      for (const { name, value } of updateItems) {
        const key = SEARCH_PARAMS_FIELDS[name];
        if (!value) {
          searchParamsStr.delete(key);
        } else {
          searchParamsStr.set(key, lowerCase ? value.toLowerCase() : value);
        }
      }
      return searchParamsStr.toString();
    },
    [searchParams]
  );

  const calculateSortDirection = ({
    newSortBy,
    currentSortBy,
    currentSortDirection,
  }: {
    newSortBy: ApiCommunityMembersSortOption;
    currentSortBy: ApiCommunityMembersSortOption;
    currentSortDirection: SortDirection;
  }): SortDirection | null => {
    if (newSortBy === currentSortBy) {
      if (currentSortDirection === SortDirection.ASC) {
        return SortDirection.DESC;
      }
      return SortDirection.ASC;
    }
    return defaultSortDirection;
  };

  const [debouncedParams, setDebouncedParams] = useState<CommunityMembersQuery>(
    () => params
  );

  useDebounce(() => setDebouncedParams(params), 200, [params]);

  const {
    isLoading,
    isFetching,
    data: members,
  } = useQuery<Page<ApiCommunityMemberOverview>>({
    queryKey: [
      QueryKey.COMMUNITY_MEMBERS_TOP,
      {
        page: debouncedParams.page,
        pageSize: debouncedParams.page_size,
        sort: debouncedParams.sort,
        sortDirection: debouncedParams.sort_direction,
        groupId: debouncedParams.group_id,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<
        Page<ApiCommunityMemberOverview>,
        CommunityMembersQuery
      >({
        endpoint: `community-members/top`,
        params: debouncedParams,
      }),
    placeholderData: keepPreviousData,
  });

  const updateFields = useCallback(
    (updateItems: QueryUpdateInput[], lowerCase: boolean = true): void => {
      const queryString = createQueryString(updateItems, lowerCase);
      const path = queryString ? `${pathname}?${queryString}` : pathname;
      if (path) {
        router.replace(path);
      }
    },
    [createQueryString, pathname, router]
  );

  const setSortBy = async (
    sortBy: ApiCommunityMembersSortOption
  ): Promise<void> => {
    const items: QueryUpdateInput[] = [
      {
        name: "sortBy",
        value: sortBy,
      },
      {
        name: "sortDirection",
        value: calculateSortDirection({
          newSortBy: sortBy,
          currentSortBy: debouncedParams.sort,
          currentSortDirection: debouncedParams.sort_direction,
        }),
      },
      {
        name: "page",
        value: "1",
      },
    ];
    await updateFields(items);
  };

  useEffect(() => {
    const urlGroup = params.group_id ?? null;
    const stateGroup = activeGroupId ?? null;
    if (urlGroup === stateGroup) return;

    const items: QueryUpdateInput[] = [
      {
        name: "group",
        value: stateGroup,
      },
      {
        name: "page",
        value: "1",
      },
    ];
    updateFields(items, false);
  }, [activeGroupId, params.group_id, updateFields]);

  const setPage = useCallback(
    async (page: number): Promise<void> => {
      const items: QueryUpdateInput[] = [
        {
          name: "page",
          value: page.toString(),
        },
      ];
      await updateFields(items);
    },
    [updateFields]
  );

  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    if (isLoading) return;
    if (!members?.count) {
      setPage(1);
      setTotalPages(1);
      return;
    }
    const pagesCount = Math.ceil(members.count / debouncedParams.page_size);
    if (pagesCount < debouncedParams.page) setPage(pagesCount);
    setTotalPages(pagesCount);
  }, [
    debouncedParams.page,
    debouncedParams.page_size,
    isLoading,
    members?.count,
    setPage,
  ]);

  const goToNerd = () => router.push("/network/nerd");

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

  useEffect(() => {
    setMobileFilterOpen(false);
  }, [activeGroupId]);

  return (
    <div>
      <div className="tw-flex tw-items-center tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <h1 className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-50">
            Network
          </h1>
          <button
            type="button"
            className={`tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out focus:tw-outline-none ${
              activeGroupId
                ? "tw-border-primary-500 tw-bg-primary-500/20 tw-text-primary-300"
                : "tw-border-iron-600 tw-bg-iron-800 tw-text-iron-300 hover:tw-bg-iron-700"
            }`}
            onClick={() => setMobileFilterOpen(true)}
            aria-label="Open filter panel"
          >
            <FunnelIcon className="tw-h-5 tw-w-5" />
          </button>
          <button
            type="button"
            className="tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-800 tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-700 focus:tw-outline-none sm:tw-hidden"
            onClick={() => setMobileSortOpen(true)}
            aria-label="Open sort options"
          >
            <FontAwesomeIcon
              icon={faArrowDownWideShort}
              className="tw-h-5 tw-w-5"
            />
          </button>
        </div>
        <div className="tw-ml-auto tw-inline-flex tw-items-center tw-space-x-3">
          <button
            type="button"
            className="tw-inline-flex tw-items-center tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-700 focus:tw-z-10 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
            onClick={goToNerd}
          >
            <span>Nerd view</span>
            <svg
              className="-tw-mr-1.5 tw-h-5 tw-w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="tailwind-scope tw-mt-2 tw-flow-root lg:tw-mt-3">
        {members ? (
          <>
            <div className="tw-rounded-lg tw-bg-iron-950 tw-shadow sm:tw-divide-y sm:tw-divide-solid sm:tw-divide-iron-800 sm:tw-overflow-auto sm:tw-border sm:tw-border-solid sm:tw-border-iron-700">
              <CommunityMembersTable
                members={members.data}
                activeSort={params.sort}
                sortDirection={params.sort_direction}
                page={members.page}
                pageSize={params.page_size}
                isLoading={isFetching}
                onSort={setSortBy}
              />
            </div>
            {totalPages > 1 && (
              <CommonTablePagination
                currentPage={members.page}
                setCurrentPage={setPage}
                totalPages={totalPages}
                haveNextPage={members.next}
                small={false}
                loading={isLoading}
              />
            )}
          </>
        ) : (
          <CommunityMembersTableSkeleton />
        )}
      </div>

      <MobileWrapperDialog
        title="Filter"
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        tall
        fixedHeight
      >
        <div className="tw-px-4">
          <GroupsSidebar />
        </div>
      </MobileWrapperDialog>

      <MobileWrapperDialog
        title="Sort"
        isOpen={mobileSortOpen}
        onClose={() => setMobileSortOpen(false)}
      >
        <CommunityMembersMobileSortContent
          activeSort={params.sort}
          sortDirection={params.sort_direction}
          onSort={(sort) => {
            setSortBy(sort);
          }}
        />
      </MobileWrapperDialog>
    </div>
  );
}
