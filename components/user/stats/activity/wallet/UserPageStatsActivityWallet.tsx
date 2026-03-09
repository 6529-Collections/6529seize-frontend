"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { NFTLite } from "@/components/user/settings/UserSettingsImgSelectMeme";
import type { NextGenCollection } from "@/entities/INextgen";
import type { Transaction } from "@/entities/ITransaction";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useReducer, useState } from "react";
import UserPageStatsActivityWalletTableWrapper from "./table/UserPageStatsActivityWalletTableWrapper";

export enum UserPageStatsActivityWalletFilterType {
  ALL = "ALL",
  AIRDROPS = "AIRDROPS",
  MINTS = "MINTS",
  SALES = "SALES",
  PURCHASES = "PURCHASES",
  TRANSFERS = "TRANSFERS",
  BURNS = "BURNS",
}

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

export default function UserPageStatsActivityWallet({
  profile,
  activeAddress,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
}) {
  const FILTER_TO_PARAM: Record<UserPageStatsActivityWalletFilterType, string> =
    {
      [UserPageStatsActivityWalletFilterType.ALL]: "",
      [UserPageStatsActivityWalletFilterType.AIRDROPS]: "airdrops",
      [UserPageStatsActivityWalletFilterType.MINTS]: "mints",
      [UserPageStatsActivityWalletFilterType.SALES]: "sales",
      [UserPageStatsActivityWalletFilterType.PURCHASES]: "purchases",
      [UserPageStatsActivityWalletFilterType.TRANSFERS]: "transfers",
      [UserPageStatsActivityWalletFilterType.BURNS]: "burns",
    };

  const [activeFilter, setActiveFilter] =
    useState<UserPageStatsActivityWalletFilterType>(
      UserPageStatsActivityWalletFilterType.ALL
    );

  const [pageFilter, dispatchPageFilter] = useReducer(pageFilterReducer, 1);

  const onActiveFilter = (filter: UserPageStatsActivityWalletFilterType) => {
    const targetFilter =
      filter === activeFilter
        ? UserPageStatsActivityWalletFilterType.ALL
        : filter;
    setActiveFilter(targetFilter);
    dispatchPageFilter({ type: "set", page: 1 });
  };

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
  } = useQuery<Page<Transaction>>({
    queryKey: [
      QueryKey.PROFILE_TRANSACTIONS,
      {
        page_size: `${PAGE_SIZE}`,
        page: `${pageFilter}`,
        wallet: walletsParam,
        filter: activeFilter,
      },
    ],
    queryFn: async () => {
      const params: Record<string, string> = {
        wallet: walletsParam,
        page_size: `${PAGE_SIZE}`,
        page: `${pageFilter}`,
      };
      const activeFilterParam = FILTER_TO_PARAM[activeFilter];

      if (activeFilterParam) {
        params["filter"] = activeFilterParam;
      }

      return commonApiFetch<Page<Transaction>>({
        endpoint: "transactions",
        params,
      });
    },
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

  const { isFetching: isFirstLoadingMemes, data: memes } = useQuery({
    queryKey: [QueryKey.MEMES_LITE],
    queryFn: async () => {
      const memesResponse = await commonApiFetch<{
        count: number;
        data: NFTLite[];
        next: string | null;
        page: number;
      }>({
        endpoint: "memes_lite",
      });
      return memesResponse.data;
    },
  });

  const { isFetching: isFirstLoadingMemeLab, data: memeLab } = useQuery({
    queryKey: [QueryKey.MEMELAB_LITE],
    queryFn: async () => {
      const memeLabResponse = await commonApiFetch<{
        count: number;
        data: NFTLite[];
        next: string | null;
        page: number;
      }>({
        endpoint: "memelab_lite",
      });
      return memeLabResponse.data;
    },
  });

  const { data: nextgenCollections } = useQuery({
    queryKey: [QueryKey.NEXTGEN_COLLECTIONS],
    queryFn: async () => {
      const nextgenCollectionsResponse = await commonApiFetch<{
        count: number;
        page: number;
        next: any;
        data: NextGenCollection[];
      }>({
        endpoint: "nextgen/collections",
      });
      return nextgenCollectionsResponse.data;
    },
  });

  return (
    <div className="tw-mt-4 md:tw-mt-5">
      <div className="tw-flex">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          Wallet Activity
        </h3>
      </div>
      <UserPageStatsActivityWalletTableWrapper
        filter={activeFilter}
        profile={profile}
        transactions={data?.data ?? []}
        memes={memes ?? []}
        memeLab={memeLab ?? []}
        nextgenCollections={nextgenCollections ?? []}
        totalPages={totalPages}
        page={currentPage}
        isFirstLoading={
          isFirstLoading || isFirstLoadingMemes || isFirstLoadingMemeLab
        }
        loading={isFetching}
        setPage={onPageFilter}
        onActiveFilter={onActiveFilter}
      />
    </div>
  );
}
