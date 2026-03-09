"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { Distribution } from "@/entities/IDistribution";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useReducer } from "react";
import UserPageStatsActivityDistributionsTableWrapper from "./UserPageStatsActivityDistributionsTableWrapper";

const PAGE_SIZE = 10;

const getTotalPages = (count: number | undefined, pageSize: number) =>
  typeof count === "number" && count > 0
    ? Math.max(1, Math.ceil(count / pageSize))
    : 1;

type PageFilterAction =
  | {
      readonly type: "set";
      readonly page: number;
    }
  | {
      readonly type: "sync";
      readonly count: number | undefined;
      readonly pageSize: number;
    };

const pageFilterReducer = (state: number, action: PageFilterAction): number => {
  switch (action.type) {
    case "set":
      return action.page;
    case "sync": {
      if (action.count === undefined) {
        return state;
      }

      if (action.count === 0) {
        return state === 1 ? state : 1;
      }

      const totalPages = getTotalPages(action.count, action.pageSize);
      return state > totalPages ? totalPages : state;
    }
    default:
      return state;
  }
};

export default function UserPageStatsActivityDistributions({
  profile,
  activeAddress,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
}) {
  const [pageFilter, dispatchPageFilter] = useReducer(pageFilterReducer, 1);

  const onPageFilter = (page: number) => {
    dispatchPageFilter({ type: "set", page });
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
    queryFn: () =>
      commonApiFetch<Page<Distribution>>({
        endpoint: "distributions",
        params: {
          page_size: `${PAGE_SIZE}`,
          page: `${pageFilter}`,
          wallet: walletsParam,
        },
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isFetching) {
      return;
    }

    dispatchPageFilter({
      type: "sync",
      count: data?.count,
      pageSize: PAGE_SIZE,
    });
  }, [data?.count, isFetching, pageFilter]);

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
