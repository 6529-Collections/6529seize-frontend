"use client";

import type { CommunityMembersQuery } from "@/app/network/page";
import { SortDirection } from "@/entities/ISort";
import type { ApiCommunityMemberOverview } from "@/generated/models/ApiCommunityMemberOverview";
import type { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "react-use";
import CommunityMembersMobileSortContent from "./members-table/CommunityMembersMobileSortContent";
import CommunityMembersTable from "./members-table/CommunityMembersTable";
import CommunityMembersTableSkeleton from "./members-table/CommunityMembersTableSkeleton";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import { useSetTitle } from "@/contexts/TitleContext";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import {
  BarsArrowDownIcon,
  ChevronRightIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
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

function NetworkHeaderActionButton({
  active = false,
  children,
  compact = false,
  expanded,
  hasPopup = false,
  label,
  onClick,
}: {
  readonly active?: boolean | undefined;
  readonly children: ReactNode;
  readonly compact?: boolean | undefined;
  readonly expanded?: boolean | undefined;
  readonly hasPopup?: boolean | undefined;
  readonly label: string;
  readonly onClick: () => void;
}) {
  const buttonClassName = [
    "tw-group tw-relative tw-inline-flex tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-lg tw-border-0 tw-text-sm tw-font-semibold tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400/40 sm:tw-text-xs",
    compact
      ? "tw-h-9 tw-w-9 tw-px-0 sm:tw-h-8 sm:tw-w-8"
      : "tw-h-9 tw-min-w-9 tw-px-2.5 sm:tw-h-8 sm:tw-min-w-8 sm:tw-px-2",
    active
      ? "tw-bg-primary-500/15 tw-text-primary-300 tw-ring-1 tw-ring-inset tw-ring-white/10"
      : "tw-bg-transparent tw-text-iron-300 hover:tw-bg-white/5 hover:tw-text-iron-50",
  ].join(" ");

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={onClick}
      aria-label={active ? `${label} (active)` : label}
      aria-haspopup={hasPopup ? "dialog" : undefined}
      aria-expanded={hasPopup ? expanded : undefined}
    >
      {children}
      {active && (
        <span
          aria-hidden="true"
          className="tw-absolute tw-right-1.5 tw-top-1.5 tw-size-1.5 tw-rounded-full tw-bg-primary-300"
        />
      )}
    </button>
  );
}

export default function CommunityMembers() {
  useSetTitle("Network");

  const defaultSortBy = ApiCommunityMembersSortOption.Level;
  const defaultSortDirection = SortDirection.DESC;
  const defaultPageSize = 50;
  const defaultPage = 1;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { activeGroupId } = useActiveGroup();

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

  const hasCustomSort =
    params.sort !== defaultSortBy ||
    params.sort_direction !== defaultSortDirection;
  const hasMemberContent = Boolean(members?.data.length);
  const showMembersSkeleton =
    !hasMemberContent && (isLoading || isFetching || !members);

  let membersContent: ReactNode = null;
  if (showMembersSkeleton) {
    membersContent = <CommunityMembersTableSkeleton />;
  } else if (members) {
    membersContent = (
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
    );
  }

  return (
    <div>
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
        <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-2">
          <h1 className="tw-mb-0 tw-flex-shrink-0 tw-text-xl tw-font-semibold tw-text-iron-50">
            Network
          </h1>
          <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-1 tw-rounded-xl tw-bg-iron-900/75 tw-p-1 tw-shadow-lg tw-shadow-black/30 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-backdrop-blur">
            <NetworkHeaderActionButton
              active={!!activeGroupId}
              compact
              expanded={mobileFilterOpen}
              hasPopup
              onClick={() => setMobileFilterOpen(true)}
              label="Open group filters"
            >
              <FunnelIcon className="tw-size-4" />
            </NetworkHeaderActionButton>
            <div className="sm:tw-hidden">
              <NetworkHeaderActionButton
                active={hasCustomSort}
                compact
                expanded={mobileSortOpen}
                hasPopup
                onClick={() => setMobileSortOpen(true)}
                label="Open sort options"
              >
                <BarsArrowDownIcon className="tw-size-4" />
              </NetworkHeaderActionButton>
            </div>
          </div>
        </div>
        <div className="tw-ml-auto tw-flex tw-flex-shrink-0 tw-items-center">
          <div className="tw-flex tw-items-center tw-rounded-xl tw-bg-iron-900/75 tw-p-1 tw-shadow-lg tw-shadow-black/30 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-backdrop-blur">
            <NetworkHeaderActionButton
              label="Open Nerd view"
              onClick={goToNerd}
            >
              <span className="tw-whitespace-nowrap">Nerd view</span>
              <ChevronRightIcon className="-tw-mr-0.5 tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-iron-500 tw-transition tw-duration-200 tw-ease-out group-hover:tw-translate-x-0.5 group-hover:tw-text-iron-200" />
            </NetworkHeaderActionButton>
          </div>
        </div>
      </div>
      <div className="tailwind-scope tw-mt-2 tw-flow-root lg:tw-mt-3">
        {membersContent}
      </div>

      <MobileWrapperDialog
        title="Groups"
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        tall
        fixedHeight
        noPadding
        showDragHandle
        showHeaderCloseButton
        surfaceClassName="tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-shadow-2xl tw-shadow-black/60"
        titleClassName="tw-text-base !tw-font-bold !tw-text-white tw-tracking-tight"
        headerClassName="tw-border-b tw-border-x-0 tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-3.5"
        headerCloseButtonClassName="-tw-mt-1"
      >
        <GroupsSidebar variant="mobile-sheet" />
      </MobileWrapperDialog>

      <MobileWrapperDialog
        title="Sort"
        isOpen={mobileSortOpen}
        onClose={() => setMobileSortOpen(false)}
        noPadding
        showDragHandle
        showHeaderCloseButton
        surfaceClassName="tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-shadow-2xl tw-shadow-black/60"
        titleClassName="tw-text-base !tw-font-bold !tw-text-white tw-tracking-tight"
        headerClassName="tw-border-b tw-border-x-0 tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-3.5"
        headerCloseButtonClassName="-tw-mt-1"
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
