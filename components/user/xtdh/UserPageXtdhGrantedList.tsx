"use client";

import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";

import { UserPageXtdhGrantedListContent } from "@/components/user/xtdh/granted-list/UserPageXtdhGrantedListContent";
import { UserPageXtdhGrantedListTabs } from "@/components/user/xtdh/user-page-xtdh-granted-list/components/UserPageXtdhGrantedListTabs";
import { UserPageXtdhGrantedListSubFilters } from "@/components/user/xtdh/user-page-xtdh-granted-list/components/UserPageXtdhGrantedListSubFilters";
import { getApiParamsFromFilters } from "@/components/user/xtdh/user-page-xtdh-granted-list/constants";
import { useUserPageXtdhGrantedListFilters } from "@/components/user/xtdh/user-page-xtdh-granted-list/hooks/useUserPageXtdhGrantedListFilters";
import { useXtdhGrantsQuery } from "@/hooks/useXtdhGrantsQuery";
import { usePendingGrantsCount } from "@/hooks/usePendingGrantsCount";

export type {
  GrantedFilterStatus,
  GrantedFilterStatuses,
  GrantedSortField,
} from "@/components/user/xtdh/user-page-xtdh-granted-list/types";

export interface UserPageXtdhGrantedListProps {
  readonly grantor: string;
  readonly pageSize?: number;
  readonly isSelf?: boolean;
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
    activeSortDirection,
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
    isFetching,
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
    <div className="tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-rounded-b-xl">
      <div className="tw-flex md:tw-items-center tw-flex-col md:tw-flex-row tw-justify-between tw-gap-4 tw-px-6 tw-pt-6 tw-pb-4">
        <h2 className="tw-text-base tw-font-semibold tw-text-iron-100 tw-m-0">
          Granted xTDH
        </h2>
     

      <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-justify-between tw-gap-4 tw-border-b tw-border-iron-800">
        <div className="tw-flex-1 tw-min-w-0">
          <UserPageXtdhGrantedListTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            fill={false}
            pendingCount={pendingCount}
          />
        </div>
        {activeTab === "ACTIVE" && (
          <div className="tw-w-full sm:tw-w-auto">
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
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-transition tw-bg-iron-900 tw-text-iron-400 tw-border tw-border-solid tw-border-iron-800 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-300">
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
