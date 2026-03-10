"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { Distribution } from "@/entities/IDistribution";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ACTIVITY_PAGE_SIZE,
  getActivityPaginationState,
  getActivityWalletsParam,
  useActivityPageFilter,
  useSyncActivityPageFilter,
} from "../activity.helpers";
import UserPageStatsActivityDistributionsTableWrapper from "./UserPageStatsActivityDistributionsTableWrapper";

export default function UserPageStatsActivityDistributions({
  profile,
  activeAddress,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
}) {
  const { pageFilter, setPage, syncPageFilter } = useActivityPageFilter();

  const walletsParam = useMemo(
    () =>
      getActivityWalletsParam({
        activeAddress,
        wallets: profile.wallets,
      }),
    [activeAddress, profile.wallets]
  );

  const {
    isFetching,
    isLoading: isFirstLoading,
    data,
  } = useQuery<Page<Distribution>>({
    queryKey: [
      QueryKey.PROFILE_DISTRIBUTIONS,
      {
        page_size: `${ACTIVITY_PAGE_SIZE}`,
        page: `${pageFilter}`,
        wallet: walletsParam,
      },
    ],
    queryFn: () =>
      commonApiFetch<Page<Distribution>>({
        endpoint: "distributions",
        params: {
          page_size: `${ACTIVITY_PAGE_SIZE}`,
          page: `${pageFilter}`,
          wallet: walletsParam,
        },
      }),
    placeholderData: keepPreviousData,
  });

  useSyncActivityPageFilter({
    count: data?.count,
    isFetching,
    pageFilter,
    pageSize: ACTIVITY_PAGE_SIZE,
    syncPageFilter,
  });

  const { currentPage, totalPages } = getActivityPaginationState({
    count: data?.count,
    page: data?.page,
    pageFilter,
    pageSize: ACTIVITY_PAGE_SIZE,
  });

  return (
    <div className="tw-mt-4 md:tw-mt-5">
      <div className="tw-flex">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          Distributions
        </h3>
      </div>
      <UserPageStatsActivityDistributionsTableWrapper
        data={data?.data ?? []}
        profile={profile}
        isFirstLoading={isFirstLoading}
        loading={isFetching}
        page={currentPage}
        totalPages={totalPages}
        setPage={setPage}
      />
    </div>
  );
}
