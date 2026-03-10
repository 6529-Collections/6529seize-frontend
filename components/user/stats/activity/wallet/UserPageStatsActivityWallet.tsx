"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { NFTLite } from "@/components/user/settings/UserSettingsImgSelectMeme";
import type { NextGenCollection } from "@/entities/INextgen";
import type { Transaction } from "@/entities/ITransaction";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ACTIVITY_PAGE_SIZE,
  getActivityPaginationState,
  getActivityWalletsParam,
  useActivityPageFilter,
  useSyncActivityPageFilter,
} from "../activity.helpers";
import { UserPageStatsActivityWalletFilterType } from "./UserPageStatsActivityWallet.types";
import UserPageStatsActivityWalletTableWrapper from "./table/UserPageStatsActivityWalletTableWrapper";

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
  const { pageFilter, setPage } = useActivityPageFilter();

  const onActiveFilter = (filter: UserPageStatsActivityWalletFilterType) => {
    const targetFilter =
      filter === activeFilter
        ? UserPageStatsActivityWalletFilterType.ALL
        : filter;
    setActiveFilter(targetFilter);
    setPage(1);
  };

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
  } = useQuery<Page<Transaction>>({
    queryKey: [
      QueryKey.PROFILE_TRANSACTIONS,
      {
        page_size: `${ACTIVITY_PAGE_SIZE}`,
        page: `${pageFilter}`,
        wallet: walletsParam,
        filter: activeFilter,
      },
    ],
    queryFn: async () => {
      const params: Record<string, string> = {
        wallet: walletsParam,
        page_size: `${ACTIVITY_PAGE_SIZE}`,
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

  useSyncActivityPageFilter({
    count: data?.count,
    isFetching,
    pageFilter,
    pageSize: ACTIVITY_PAGE_SIZE,
    setPage,
  });

  const { currentPage, totalPages } = getActivityPaginationState({
    count: data?.count,
    page: data?.page,
    pageFilter,
    pageSize: ACTIVITY_PAGE_SIZE,
  });

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
        next: string | null;
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
        setPage={setPage}
        onActiveFilter={onActiveFilter}
      />
    </div>
  );
}
