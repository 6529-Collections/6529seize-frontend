"use client";

import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";

import UserPageXtdhGrantedListContent from "@/components/user/xtdh/granted-list";
import { UserPageXtdhGrantedListTabs } from "@/components/user/xtdh/user-page-xtdh-granted-list/components/UserPageXtdhGrantedListTabs";
import { UserPageXtdhGrantedListSubFilters } from "@/components/user/xtdh/user-page-xtdh-granted-list/components/UserPageXtdhGrantedListSubFilters";
import { getApiParamsFromFilters } from "@/components/user/xtdh/user-page-xtdh-granted-list/constants";
import { useUserPageXtdhGrantedListFilters } from "@/components/user/xtdh/user-page-xtdh-granted-list/hooks/useUserPageXtdhGrantedListFilters";
import { useXtdhGrantsQuery } from "@/hooks/useXtdhGrantsQuery";
import { usePendingGrantsCount } from "@/hooks/usePendingGrantsCount";
import Button from "@/components/utils/button/Button";

interface UserPageXtdhGrantedListProps {
  readonly grantor: string;
  readonly pageSize?: number | undefined;
  readonly isSelf?: boolean | undefined;
}

export default function UserPageXtdhGrantedList({
  grantor,
  pageSize = 25,
  isSelf = false,
}: Readonly<UserPageXtdhGrantedListProps>) {
  const enabled = Boolean(grantor);
  const {
    activeTab,
    activeSubFilter,
    activeSortField,
    apiSortDirection,
    handleTabChange,
    handleSubFilterChange,
  } = useUserPageXtdhGrantedListFilters();

  const apiParams = useMemo(
    () => getApiParamsFromFilters(activeTab, activeSubFilter),
    [activeTab, activeSubFilter]
  );

  const {
    grants,
    isLoading,
    isError,
    errorMessage,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useXtdhGrantsQuery({
    grantor,
    pageSize,
    statuses: apiParams.statuses,
    validFromGt: apiParams.validFromGt,
    validFromLt: apiParams.validFromLt,
    validToGt: apiParams.validToGt,
    validToLt: apiParams.validToLt,
    sortField: activeSortField,
    sortDirection: apiSortDirection,
    enabled,
  });

  const { count: pendingCount } = usePendingGrantsCount({
    grantor,
    enabled,
  });

  const queryClient = useQueryClient();
  const { invalidateIdentityTdhStats } = useContext(ReactQueryWrapperContext);
  const prevPendingCount = useRef(pendingCount);

  useEffect(() => {
    if (prevPendingCount.current !== pendingCount) {
      queryClient.invalidateQueries({
        queryKey: [QueryKey.TDH_GRANTS, grantor],
      });
      invalidateIdentityTdhStats({ identity: grantor });
      prevPendingCount.current = pendingCount;
    }
  }, [pendingCount, queryClient, grantor, invalidateIdentityTdhStats]);

  const handleRetry = useCallback(() => {
    refetch().catch(() => {
      // Errors propagate through the query state that's already rendered.
    });
  }, [refetch]);

  const showLoadMore = hasNextPage && !isError;

  return (
    <div className="tw-space-y-4">
      <div className="tw-flex tw-flex-col tw-gap-4">
        <h2 className="tw-sr-only">Granted xTDH</h2>

        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
          <div className="tw-min-w-0 tw-flex-1">
            <UserPageXtdhGrantedListTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              fill={false}
              pendingCount={pendingCount}
            />
          </div>
          {activeTab === "ACTIVE" && (
            <div className="tw-w-auto tw-shrink-0 [&_button[aria-haspopup]:not(:focus)]:tw-ring-0 [&_button[aria-haspopup]]:tw-h-8 [&_button[aria-haspopup]]:tw-border [&_button[aria-haspopup]]:tw-border-solid [&_button[aria-haspopup]]:tw-border-white/[0.06] [&_button[aria-haspopup]]:tw-bg-transparent [&_button[aria-haspopup]]:tw-py-1 [&_button[aria-haspopup]]:tw-text-[13px] [&_button[aria-haspopup]]:tw-font-medium [&_button[aria-haspopup]]:tw-text-iron-300 [&_button[aria-haspopup]]:tw-shadow-none">
              <UserPageXtdhGrantedListSubFilters
                activeSubFilter={activeSubFilter}
                onSubFilterChange={handleSubFilterChange}
              />
            </div>
          )}
        </div>
      </div>
      <UserPageXtdhGrantedListContent
        enabled={enabled}
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        grants={grants}
        isSelf={isSelf}
        onRetry={handleRetry}
        statuses={apiParams.statuses}
      />
      {showLoadMore && (
        <div className="tw-flex tw-justify-center tw-px-6 tw-pb-6">
          <Button
            variant="tertiary"
            size="md"
            onClick={() => fetchNextPage()}
            loading={isFetchingNextPage}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
