"use client";

import { useCallback, useMemo } from "react";

import { UserPageXtdhGrantedListContent } from "@/components/user/xtdh/granted-list/UserPageXtdhGrantedListContent";
import { UserPageXtdhGrantedListControls } from "@/components/user/xtdh/user-page-xtdh-granted-list/components/UserPageXtdhGrantedListControls";
import {
  getUserPageXtdhGrantedListStatusItems,
} from "@/components/user/xtdh/user-page-xtdh-granted-list/constants";
import { getUserPageXtdhGrantedListResultSummary } from "@/components/user/xtdh/user-page-xtdh-granted-list/helpers";
import { useUserPageXtdhGrantedListFilters } from "@/components/user/xtdh/user-page-xtdh-granted-list/hooks/useUserPageXtdhGrantedListFilters";
import { useUserPageXtdhGrantedListStatusCounts } from "@/components/user/xtdh/user-page-xtdh-granted-list/hooks/useUserPageXtdhGrantedListStatusCounts";
import { useXtdhGrantsQuery } from "@/hooks/useXtdhGrantsQuery";

export type {
  GrantedFilterStatus,
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
    activeStatus,
    activeSortField,
    activeSortDirection,
    apiSortDirection,
    handleStatusChange,
    handleSortFieldChange,
  } = useUserPageXtdhGrantedListFilters();

  const {
    grants,
    totalCount,
    isLoading,
    isError,
    isFetching,
    errorMessage,
    refetch,
    firstPage,
  } = useXtdhGrantsQuery({
    grantor,
    pageSize,
    status: activeStatus,
    sortField: activeSortField,
    sortDirection: apiSortDirection,
    enabled,
  });
  const statusCounts = useUserPageXtdhGrantedListStatusCounts({
    activeStatus,
    data: firstPage,
    grantor,
  });

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const showControls = enabled && !isError;

  const formattedStatusItems = useMemo(
    () => getUserPageXtdhGrantedListStatusItems(statusCounts),
    [statusCounts]
  );

  const resultSummary = useMemo(
    () =>
      getUserPageXtdhGrantedListResultSummary({
        activeStatus,
        isError,
        isLoading,
        isFetching,
        totalCount,
      }),
    [activeStatus, isError, isFetching, isLoading, totalCount]
  );

  const areControlsDisabled = isFetching || isLoading;

  return (
    <div className="tw-bg-iron-950 tw-border tw-border-iron-800 tw-rounded-2xl tw-p-4 tw-space-y-4">
      <div className="tw-flex tw-items-center">
        <h2 className="tw-text-base tw-font-semibold tw-text-iron-100 tw-m-0">
          Granted xTDH
        </h2>
      </div>
      <UserPageXtdhGrantedListControls
        isVisible={showControls}
        formattedStatusItems={formattedStatusItems}
        activeStatus={activeStatus}
        activeSortField={activeSortField}
        activeSortDirection={activeSortDirection}
        onStatusChange={handleStatusChange}
        onSortFieldChange={handleSortFieldChange}
        resultSummary={resultSummary}
        isDisabled={areControlsDisabled}
      />
      <UserPageXtdhGrantedListContent
        enabled={enabled}
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        grants={grants}
        isSelf={isSelf}
        onRetry={handleRetry}
        status={activeStatus}
      />
    </div>
  );
}
