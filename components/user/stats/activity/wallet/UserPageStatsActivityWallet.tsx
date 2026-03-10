"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { NFTLite } from "@/components/user/settings/UserSettingsImgSelectMeme";
import type { NextGenCollection } from "@/entities/INextgen";
import type { Transaction } from "@/entities/ITransaction";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  ACTIVITY_PAGE_SIZE,
  getActivityPaginationState,
  getActivityWalletsParam,
  WALLET_ACTIVITY_FILTER_PARAM,
  WALLET_ACTIVITY_PAGE_PARAM,
} from "../activity.helpers";
import { UserPageStatsActivityWalletFilterType } from "./UserPageStatsActivityWallet.types";
import UserPageStatsActivityWalletTableWrapper from "./table/UserPageStatsActivityWalletTableWrapper";

const ENUM_AND_PATH: {
  type: UserPageStatsActivityWalletFilterType;
  path: string;
}[] = [
  { type: UserPageStatsActivityWalletFilterType.ALL, path: "all" },
  { type: UserPageStatsActivityWalletFilterType.AIRDROPS, path: "airdrops" },
  { type: UserPageStatsActivityWalletFilterType.MINTS, path: "mints" },
  { type: UserPageStatsActivityWalletFilterType.SALES, path: "sales" },
  { type: UserPageStatsActivityWalletFilterType.PURCHASES, path: "purchases" },
  { type: UserPageStatsActivityWalletFilterType.TRANSFERS, path: "transfers" },
  { type: UserPageStatsActivityWalletFilterType.BURNS, path: "burns" },
];

const enumToPath = (type: UserPageStatsActivityWalletFilterType): string => {
  const found = ENUM_AND_PATH.find((entry) => entry.type === type);
  return found?.path ?? "";
};

const pathToEnum = (path: string): UserPageStatsActivityWalletFilterType => {
  const found = ENUM_AND_PATH.find((entry) => entry.path === path);
  return found?.type ?? UserPageStatsActivityWalletFilterType.ALL;
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

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activity = searchParams.get(WALLET_ACTIVITY_FILTER_PARAM);
  const page = searchParams.get(WALLET_ACTIVITY_PAGE_PARAM);
  const activeFilter = pathToEnum(activity ?? "");
  const pageFilter = page && !Number.isNaN(+page) ? +page : 1;

  const createQueryString = useCallback(
    (
      config: {
        name: string;
        value: string;
      }[]
    ): string => {
      const params = new URLSearchParams(searchParams.toString());
      for (const { name, value } of config) {
        params.set(name, value);
      }
      return params.toString();
    },
    [searchParams]
  );

  const onActiveFilter = (filter: UserPageStatsActivityWalletFilterType) => {
    const targetFilter =
      filter === activeFilter
        ? UserPageStatsActivityWalletFilterType.ALL
        : filter;
    router.replace(
      `${pathname}?${createQueryString([
        { name: WALLET_ACTIVITY_FILTER_PARAM, value: enumToPath(targetFilter) },
        { name: WALLET_ACTIVITY_PAGE_PARAM, value: "1" },
      ])}`,
      { scroll: false }
    );
  };

  const onPageFilter = useCallback(
    (nextPage: number) => {
      router.replace(
        `${pathname}?${createQueryString([
          { name: WALLET_ACTIVITY_PAGE_PARAM, value: `${nextPage}` },
        ])}`,
        { scroll: false }
      );
    },
    [createQueryString, pathname, router]
  );

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
        filter: FILTER_TO_PARAM[activeFilter],
      };

      return commonApiFetch<Page<Transaction>>({
        endpoint: "transactions",
        params,
      });
    },
    placeholderData: keepPreviousData,
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
        setPage={onPageFilter}
        onActiveFilter={onActiveFilter}
      />
    </div>
  );
}
