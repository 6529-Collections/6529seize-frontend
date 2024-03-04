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
import CommonTablePagination from "../utils/table/CommonTablePagination";
import { SortDirection } from "../../entities/ISort";
import CommunityMembersTable from "./members-table/CommunityMembersTable";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useDebounce } from "react-use";
import CommonCardSkeleton from "../utils/animation/CommonCardSkeleton";

interface QueryUpdateInput {
  name: keyof typeof SEARCH_PARAMS_FIELDS;
  value: string | null;
}

const SEARCH_PARAMS_FIELDS = {
  page: "page",
  sortBy: "sort-by",
  sortDirection: "sort-direction",
} as const;

export default function CommunityMembers() {
  const defaultSortBy = CommunityMembersSortOption.LEVEL;
  const defaultSortDirection = SortDirection.DESC;
  const defaultPageSize = 20;
  const defaultPage = 1;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    return {
      page: page || defaultPage,
      page_size: defaultPageSize,
      sort: convertSortBy(sortBy),
      sort_direction: convertSortDirection(sortDirection),
    };
  };

  const createQueryString = (updateItems: QueryUpdateInput[]): string => {
    const searchParamsStr = new URLSearchParams(searchParams.toString());
    for (const { name, value } of updateItems) {
      const key = SEARCH_PARAMS_FIELDS[name];
      if (!value) {
        searchParamsStr.delete(key);
      } else {
        searchParamsStr.set(key, value.toLowerCase());
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

  const [totalPages, setTotalPages] = useState<number>(1);
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

  const updateFields = async (
    updateItems: QueryUpdateInput[]
  ): Promise<void> => {
    const queryString = createQueryString(updateItems);
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

  const setPage = async (page: number): Promise<void> => {
    const items: QueryUpdateInput[] = [
      {
        name: "page",
        value: page.toString(),
      },
    ];
    await updateFields(items);
  };

  if (!members)
    return (
      <div className="tw-h-screen tw-w-full">
        <CommonCardSkeleton />
      </div>
    );

  return (
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
          currentPage={params.page}
          setCurrentPage={setPage}
          totalPages={totalPages}
          small={false}
          loading={isLoading}
        />
      )}
    </div>
  );
}
