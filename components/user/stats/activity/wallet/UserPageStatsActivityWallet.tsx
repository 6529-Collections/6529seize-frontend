"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { NFTLite } from "@/components/user/settings/UserSettingsImgSelectMeme";
import { NextGenCollection } from "@/entities/INextgen";
import { Transaction } from "@/entities/ITransaction";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  WALLET_ACTIVITY_FILTER_PARAM,
  WALLET_ACTIVITY_PAGE_PARAM,
} from "../UserPageActivityWrapper";
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
  const found = ENUM_AND_PATH.find((e) => e.type === type);
  return found?.path ?? "";
};

const pathToEnum = (path: string): UserPageStatsActivityWalletFilterType => {
  const found = ENUM_AND_PATH.find((e) => e.path === path);
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

  const PAGE_SIZE = 10;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activity = searchParams?.get(WALLET_ACTIVITY_FILTER_PARAM);
  const page = searchParams?.get(WALLET_ACTIVITY_PAGE_PARAM);

  const [activeFilter, setActiveFilter] =
    useState<UserPageStatsActivityWalletFilterType>(
      UserPageStatsActivityWalletFilterType.ALL
    );

  const [pageFilter, setPageFilter] = useState(
    page && !isNaN(+page) ? +page : 1
  );

  useEffect(() => {
    setActiveFilter(pathToEnum(activity ?? ""));
  }, [activity]);

  useEffect(() => {
    setPageFilter(page && !isNaN(+page) ? +page : 1);
  }, [page]);

  const createQueryString = (
    config: {
      name: string;
      value: string;
    }[]
  ): string => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    for (const { name, value } of config) {
      params.set(name, value);
    }
    return params.toString();
  };

  const onActiveFilter = (filter: UserPageStatsActivityWalletFilterType) => {
    const targetFilter =
      filter === activeFilter
        ? UserPageStatsActivityWalletFilterType.ALL
        : filter;
    router.replace(
      `${pathname}?${createQueryString([
        { name: WALLET_ACTIVITY_FILTER_PARAM, value: enumToPath(targetFilter) },
        { name: WALLET_ACTIVITY_PAGE_PARAM, value: "1" },
      ])}`
    );
  };

  const onPageFilter = (page: number) => {
    router.replace(
      `${pathname}?${createQueryString([
        { name: WALLET_ACTIVITY_PAGE_PARAM, value: `${page}` },
      ])}`,
      { scroll: false }
    );
  };

  const [totalPages, setTotalPages] = useState<number>(1);

  const getWalletsParam = () =>
    [
      activeAddress?.toLowerCase() ??
        profile.wallets?.map((w) => w.wallet.toLowerCase()),
    ].join(",");

  const [walletsParam, setWalletsParam] = useState<string>(getWalletsParam());
  useEffect(() => {
    setWalletsParam(getWalletsParam());
  }, [activeAddress, profile]);

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

      if (activeFilter) {
        params.filter = FILTER_TO_PARAM[activeFilter];
      }

      return await commonApiFetch<Page<Transaction>>({
        endpoint: "transactions",
        params,
      });
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isFetching) return;
    if (!data?.count) {
      onPageFilter(1);
      setTotalPages(1);
      return;
    }
    const pagesCount = Math.ceil(data.count / PAGE_SIZE);
    if (pagesCount < pageFilter) {
      onPageFilter(pagesCount);
      return;
    }
    setTotalPages(pagesCount);
  }, [data?.count, data?.page, isFetching]);

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
        page={pageFilter}
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
