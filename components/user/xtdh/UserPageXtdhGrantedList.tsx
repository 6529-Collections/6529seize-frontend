"use client";

import { useCallback, useMemo } from "react";

import { UserPageXtdhGrantedListContent } from "@/components/user/xtdh/granted-list/UserPageXtdhGrantedListContent";
import { UserPageXtdhGrantedListTabs } from "@/components/user/xtdh/user-page-xtdh-granted-list/components/UserPageXtdhGrantedListTabs";
import { UserPageXtdhGrantedListSubFilters } from "@/components/user/xtdh/user-page-xtdh-granted-list/components/UserPageXtdhGrantedListSubFilters";
import { getApiParamsFromFilters } from "@/components/user/xtdh/user-page-xtdh-granted-list/constants";
import { useUserPageXtdhGrantedListFilters } from "@/components/user/xtdh/user-page-xtdh-granted-list/hooks/useUserPageXtdhGrantedListFilters";
import { useXtdhGrantsQuery } from "@/hooks/useXtdhGrantsQuery";

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


  const handleRetry = useCallback(() => {
    refetch().catch(() => {
      // Errors propagate through the query state that's already rendered.
    });
  }, [refetch]);

  const showLoadMore = hasNextPage && !isError;

  return (
    <div className="tw-bg-iron-950 tw-border tw-border-iron-800 tw-rounded-2xl tw-p-4 tw-space-y-4">
      <div className="tw-flex tw-items-center">
        <h2 className="tw-text-base tw-font-semibold tw-text-iron-100 tw-m-0">
          Granted xTDH
        </h2>
      </div>

      <div>
        <UserPageXtdhGrantedListTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        {activeTab === "ACTIVE" && (
          <UserPageXtdhGrantedListSubFilters
            activeSubFilter={activeSubFilter}
            onSubFilterChange={handleSubFilterChange}
          />
        )}
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
        <div className="tw-flex tw-justify-center">
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
