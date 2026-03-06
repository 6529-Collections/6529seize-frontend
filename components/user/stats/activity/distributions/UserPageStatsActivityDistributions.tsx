"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { Distribution } from "@/entities/IDistribution";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import UserPageStatsActivityDistributionsTableWrapper from "./UserPageStatsActivityDistributionsTableWrapper";

const PAGE_SIZE = 10;

const getTotalPages = (count: number | undefined, pageSize: number) =>
  typeof count === "number" && count > 0
    ? Math.max(1, Math.ceil(count / pageSize))
    : 1;

export default function UserPageStatsActivityDistributions({
  profile,
  activeAddress,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
}) {
  const [pageFilter, setPageFilter] = useState(1);

  const onPageFilter = (page: number) => {
    setPageFilter(page);
  };

  const walletsParam = useMemo(() => {
    if (activeAddress) {
      return activeAddress.toLowerCase();
    }

    return (profile.wallets ?? [])
      .map((wallet) => wallet.wallet.toLowerCase())
      .join(",");
  }, [activeAddress, profile.wallets]);

  const {
    isFetching,
    isLoading: isFirstLoading,
    data,
  } = useQuery<Page<Distribution>>({
    queryKey: [
      QueryKey.PROFILE_DISTRIBUTIONS,
      {
        page_size: `${PAGE_SIZE}`,
        page: `${pageFilter}`,
        wallet: walletsParam,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<Page<Distribution>>({
        endpoint: "distributions",
        params: {
          page_size: `${PAGE_SIZE}`,
          page: `${pageFilter}`,
          wallet: walletsParam,
        },
      }).then(async (response) => {
        const totalPages = getTotalPages(response.count, PAGE_SIZE);
        if (response.count > 0 && pageFilter > totalPages) {
          return await commonApiFetch<Page<Distribution>>({
            endpoint: "distributions",
            params: {
              page_size: `${PAGE_SIZE}`,
              page: `${totalPages}`,
              wallet: walletsParam,
            },
          });
        }

        return response;
      }),
    placeholderData: keepPreviousData,
  });

  const totalPages = getTotalPages(data?.count, PAGE_SIZE);
  const responsePage = typeof data?.page === "number" ? data.page : pageFilter;
  const currentPage =
    typeof data?.count === "number" && data.count > 0
      ? Math.min(responsePage, totalPages)
      : 1;

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
        setPage={onPageFilter}
      />
    </div>
  );
}
