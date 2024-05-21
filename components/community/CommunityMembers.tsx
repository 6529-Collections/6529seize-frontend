import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CommunityMemberOverview } from "../../entities/IProfile";
import { Page } from "../../helpers/Types";
import {
  CommunityMembersQuery,
  CommunityMembersSortOption,
} from "../../pages/community";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { useEffect, useState } from "react";
import { commonApiFetch } from "../../services/api/common-api";
import { SortDirection } from "../../entities/ISort";
import CommunityMembersTable from "./members-table/CommunityMembersTable";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useDebounce } from "react-use";
import CommonCardSkeleton from "../utils/animation/CommonCardSkeleton";

import { useSelector } from "react-redux";
import { selectActiveCurationFilterId } from "../../store/curationFilterSlice";
import CommonTablePagination from "../utils/table/paginator/CommonTablePagination";

interface QueryUpdateInput {
  name: keyof typeof SEARCH_PARAMS_FIELDS;
  value: string | null;
}

const SEARCH_PARAMS_FIELDS = {
  page: "page",
  sortBy: "sort-by",
  sortDirection: "sort-direction",
  curation: "curation",
} as const;

export default function CommunityMembers() {
  const defaultSortBy = CommunityMembersSortOption.LEVEL;
  const defaultSortDirection = SortDirection.DESC;
  const defaultPageSize = 50;
  const defaultPage = 1;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCurationFilterId = useSelector(selectActiveCurationFilterId);

  const convertSortBy = (sort: string | null): CommunityMembersSortOption => {
    if (!sort) return defaultSortBy;
    if (
      Object.values(CommunityMembersSortOption).includes(
        sort.toLowerCase() as any
      )
    ) {
      return sort.toLowerCase() as CommunityMembersSortOption;
    }
    return defaultSortBy;
  };

  const convertSortDirection = (
    sortDirection: string | null
  ): SortDirection => {
    if (!sortDirection) return defaultSortDirection;
    if (
      Object.values(SortDirection).includes(sortDirection.toUpperCase() as any)
    ) {
      return sortDirection.toUpperCase() as SortDirection;
    }
    return defaultSortDirection;
  };

  const getParamsFromUrl = (): CommunityMembersQuery => {
    const page = parseInt(searchParams.get(SEARCH_PARAMS_FIELDS.page) || "");
    const sortBy = searchParams.get(SEARCH_PARAMS_FIELDS.sortBy);
    const sortDirection = searchParams.get(SEARCH_PARAMS_FIELDS.sortDirection);
    const curation = searchParams.get(SEARCH_PARAMS_FIELDS.curation);
    const query: CommunityMembersQuery = {
      page: page || defaultPage,
      page_size: defaultPageSize,
      sort: convertSortBy(sortBy),
      sort_direction: convertSortDirection(sortDirection),
    };
    if (curation) {
      query.curation_criteria_id = curation;
    }
    return query;
  };

  const createQueryString = (
    updateItems: QueryUpdateInput[],
    lowerCase: boolean = true
  ): string => {
    const searchParamsStr = new URLSearchParams(searchParams.toString());
    for (const { name, value } of updateItems) {
      const key = SEARCH_PARAMS_FIELDS[name];
      if (!value) {
        searchParamsStr.delete(key);
      } else {
        searchParamsStr.set(key, lowerCase ? value.toLowerCase() : value);
      }
    }
    return searchParamsStr.toString();
  };

  const [params, setParams] = useState(getParamsFromUrl());
  useEffect(() => setParams(getParamsFromUrl()), [searchParams]);

  const calculateSortDirection = ({
    newSortBy,
    currentSortBy,
    currentSortDirection,
  }: {
    newSortBy: CommunityMembersSortOption;
    currentSortBy: CommunityMembersSortOption;
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

  const [debouncedParams, setDebouncedParams] =
    useState<CommunityMembersQuery>(params);

  useDebounce(() => setDebouncedParams(params), 200, [params]);

  const {
    isLoading,
    isFetching,
    data: members,
  } = useQuery<Page<CommunityMemberOverview>>({
    queryKey: [QueryKey.COMMUNITY_MEMBERS_TOP, debouncedParams],
    queryFn: async () =>
      await commonApiFetch<
        Page<CommunityMemberOverview>,
        CommunityMembersQuery
      >({
        endpoint: `community-members/top`,
        params: debouncedParams,
      }),
    placeholderData: keepPreviousData,
  });

  const updateFields = async (
    updateItems: QueryUpdateInput[],
    lowerCase: boolean = true
  ): Promise<void> => {
    const queryString = createQueryString(updateItems, lowerCase);
    const path = queryString ? pathname + "?" + queryString : pathname;
    await router.replace(path, undefined, {
      shallow: true,
    });
  };

  const setSortBy = async (
    sortBy: CommunityMembersSortOption
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
    if (params.curation_criteria_id !== activeCurationFilterId) {
      const items: QueryUpdateInput[] = [
        {
          name: "curation",
          value: activeCurationFilterId,
        },
        {
          name: "page",
          value: "1",
        },
      ];
      updateFields(items, false);
    }
  }, [activeCurationFilterId]);

  const setPage = async (page: number): Promise<void> => {
    const items: QueryUpdateInput[] = [
      {
        name: "page",
        value: page.toString(),
      },
    ];
    await updateFields(items);
  };

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
  }, [members?.count, isLoading]);

  const goToNerd = () => router.push("/community-nerd");

  return (
    <div>
      <div className="tw-flex tw-items-center tw-justify-between">
        <h1 className="tw-block tw-float-none">Community</h1>
        <div className="tw-inline-flex tw-space-x-3 tw-items-center">
          <button
            type="button"
            className="tw-text-sm tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-iron-200 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
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
      {members ? (
        <div>
          <div className="tailwind-scope tw-mt-4 lg:tw-mt-6 tw-flow-root">
            <div className="tw-overflow-auto tw-bg-iron-950 tw-shadow tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg tw-divide-y tw-divide-solid tw-divide-iron-800">
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
        </div>
      ) : (
        <div className="tw-h-screen tw-w-full">
          <CommonCardSkeleton />
        </div>
      )}
    </div>
  );
}
