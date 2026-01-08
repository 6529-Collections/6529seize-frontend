"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ApiCommunityMemberOverview } from "@/generated/models/ApiCommunityMemberOverview";
import type { Page } from "@/helpers/Types";
import type { CommunityMembersQuery } from "@/app/network/page";
import { useCallback, useEffect, useMemo, useState } from "react";
import { commonApiFetch } from "@/services/api/common-api";
import { SortDirection } from "@/entities/ISort";
import CommunityMembersTable from "./members-table/CommunityMembersTable";
import CommunityMembersSortControls from "./members-table/CommunityMembersSortControls";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useDebounce } from "react-use";
import CommunityMembersTableSkeleton from "./members-table/CommunityMembersTableSkeleton";

import { useSelector } from "react-redux";
import { selectActiveGroupId } from "@/store/groupSlice";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useSetTitle } from "@/contexts/TitleContext";
import MobileWrapperDialog from "../mobile-wrapper-dialog/MobileWrapperDialog";
import GroupsSidebar from "../groups/sidebar/GroupsSidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDownWideShort } from "@fortawesome/free-solid-svg-icons";
import { FunnelIcon } from "@heroicons/react/24/outline";
import CommunityMembersMobileSortContent from "./members-table/CommunityMembersMobileSortContent";

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

  const defaultSortBy = ApiCommunityMembersSortOption.CombinedTdh;
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
          sort.toLowerCase() as any
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
          sortDirection.toUpperCase() as any
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


  const [debouncedParams, setDebouncedParams] = useState<CommunityMembersQuery>(
    () => params
  );

  useDebounce(() => setDebouncedParams(params), 200, [params]);

  const { isLoading, data: members } = useQuery<Page<ApiCommunityMemberOverview>>({
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

  const setSortBy = useCallback(
    async (sortBy: ApiCommunityMembersSortOption): Promise<void> => {
      const items: QueryUpdateInput[] = [
        { name: "sortBy", value: sortBy },
        { name: "page", value: "1" },
      ];
      await updateFields(items);
    },
    [updateFields]
  );

  const setSortDirection = useCallback(
    async (direction: SortDirection): Promise<void> => {
      const items: QueryUpdateInput[] = [
        { name: "sortDirection", value: direction },
        { name: "page", value: "1" },
      ];
      await updateFields(items);
    },
    [updateFields]
  );

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
          <h1 className="tw-text-xl tw-font-semibold tw-text-iron-50 tw-mb-0">
            Network
          </h1>
          <button
            type="button"
            className={`tw-size-9 tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-rounded-lg focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out ${
              activeGroupId
                ? "tw-bg-primary-500/20 tw-border-primary-500 tw-text-primary-300"
                : "tw-bg-iron-800 hover:tw-bg-iron-700 tw-border-iron-600 tw-text-iron-300"
            }`}
            onClick={() => setMobileFilterOpen(true)}
            aria-label="Open filter panel"
          >
            <FunnelIcon className="tw-w-5 tw-h-5" />
          </button>
          <button
            type="button"
            className="tw-size-9 tw-flex tw-items-center tw-justify-center tw-bg-iron-800 hover:tw-bg-iron-700 tw-border tw-border-solid tw-border-iron-600 tw-rounded-lg focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out tw-text-iron-300 sm:tw-hidden"
            onClick={() => setMobileSortOpen(true)}
            aria-label="Open sort options"
          >
            <FontAwesomeIcon icon={faArrowDownWideShort} className="tw-w-5 tw-h-5" />
          </button>
        </div>
        <div className="tw-inline-flex tw-space-x-3 tw-items-center tw-ml-auto">
          <button
            type="button"
            className="tw-text-sm tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-iron-200 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
            onClick={goToNerd}>
            <span>Nerd view</span>
            <svg
              className="-tw-mr-1.5 tw-h-5 tw-w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="tailwind-scope tw-mt-2 lg:tw-mt-3 tw-flow-root">
        <div className="tw-hidden sm:tw-block">
          <CommunityMembersSortControls
            activeSort={params.sort}
            sortDirection={params.sort_direction}
            onSortChange={setSortBy}
            onDirectionChange={setSortDirection}
          />
        </div>
        {members ? (
          <>
            <div className="tw-mt-2 lg:tw-mt-3 sm:tw-overflow-auto tw-bg-iron-950 tw-shadow sm:tw-border sm:tw-border-solid sm:tw-border-iron-700 tw-rounded-lg sm:tw-divide-y sm:tw-divide-solid sm:tw-divide-iron-800">
              <CommunityMembersTable
                members={members.data}
                page={members.page}
                pageSize={params.page_size}
                activeSort={params.sort}
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
          <div className="tw-mt-2 lg:tw-mt-3">
            <CommunityMembersTableSkeleton />
          </div>
        )}
      </div>

      <MobileWrapperDialog
        title="Filter"
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        tall
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
          onSortChange={(sort) => {
            setSortBy(sort);
            setMobileSortOpen(false);
          }}
          onDirectionChange={(dir) => {
            setSortDirection(dir);
          }}
        />
      </MobileWrapperDialog>
    </div>
  );
}