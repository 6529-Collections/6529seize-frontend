"use client";

import { useCallback, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { UserPageXtdhGrantedListContent } from "@/components/user/xtdh/granted-list/UserPageXtdhGrantedListContent";
import { UserPageXtdhGrantedListControls } from "@/components/user/xtdh/user-page-xtdh-granted-list/components/UserPageXtdhGrantedListControls";
import {
  getUserPageXtdhGrantedListStatusItems,
} from "@/components/user/xtdh/user-page-xtdh-granted-list/constants";
import { getUserPageXtdhGrantedListResultSummary } from "@/components/user/xtdh/user-page-xtdh-granted-list/helpers";
import { useUserPageXtdhGrantedListFilters } from "@/components/user/xtdh/user-page-xtdh-granted-list/hooks/useUserPageXtdhGrantedListFilters";
import { useUserPageXtdhGrantedListStatusCounts } from "@/components/user/xtdh/user-page-xtdh-granted-list/hooks/useUserPageXtdhGrantedListStatusCounts";
import type { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";
import { commonApiFetch } from "@/services/api/common-api";

export type {
  GrantedFilterStatus,
  GrantedSortField,
} from "@/components/user/xtdh/user-page-xtdh-granted-list/types";

export interface UserPageXtdhGrantedListProps {
  readonly grantor: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly isSelf?: boolean;
}

export default function UserPageXtdhGrantedList({
  grantor,
  page = 1,
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
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      QueryKey.TDH_GRANTS,
      grantor,
      page.toString(),
      pageSize.toString(),
      activeStatus,
      activeSortField,
      apiSortDirection,
    ],
    queryFn: async () =>
      await commonApiFetch<ApiTdhGrantsPage>({
        endpoint: "tdh-grants",
        params: {
          grantor,
          page: page.toString(),
          page_size: pageSize.toString(),
          ...(activeStatus !== "ALL" ? { status: activeStatus } : {}),
          sort: activeSortField,
          sort_direction: apiSortDirection,
        },
      }),
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const grants = useMemo(() => data?.data ?? [], [data]);
  const totalCount = data?.count ?? 0;
  const statusCounts = useUserPageXtdhGrantedListStatusCounts({
    activeStatus,
    data,
    grantor,
  });

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const errorMessage = error instanceof Error ? error.message : undefined;

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
