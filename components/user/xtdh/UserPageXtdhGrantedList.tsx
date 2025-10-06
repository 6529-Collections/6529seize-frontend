"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";
import { UserPageXtdhGrantedListContent } from "@/components/user/xtdh/granted-list/UserPageXtdhGrantedListContent";

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
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      QueryKey.TDH_GRANTS,
      grantor,
      page.toString(),
      pageSize.toString(),
    ],
    queryFn: async () =>
      await commonApiFetch<ApiTdhGrantsPage>({
        endpoint: "tdh-grants",
        params: {
          grantor,
          page,
          page_size: pageSize,
        },
      }),
    enabled,
    staleTime: 30_000,
  });

  const grants = useMemo(() => data?.data ?? [], [data]);
  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const errorMessage = error instanceof Error ? error.message : undefined;

  return (
    <div className="tw-bg-iron-950 tw-border tw-border-iron-800 tw-rounded-2xl tw-p-4 tw-space-y-4">
      <div className="tw-flex tw-items-center">
        <h2 className="tw-text-base tw-font-semibold tw-text-iron-100 tw-m-0">
          Granted xTDH
        </h2>
      </div>
      <UserPageXtdhGrantedListContent
        enabled={enabled}
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        grants={grants}
        isSelf={isSelf}
        onRetry={handleRetry}
      />
    </div>
  );
}
