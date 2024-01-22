import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import UserPageStatsActivityWalletFilter from "./filter/UserPageStatsActivityWalletFilter";
import { useRouter } from "next/router";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { WALLET_ACTIVITY_FILTER_PARAM } from "../UserPageActivityWrapper";
import UserPageStatsActivityWalletTableWrapper from "./table/UserPageStatsActivityWalletTableWrapper";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Page } from "../../../../../helpers/Types";
import { Transaction } from "../../../../../entities/ITransaction";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { MEMES_CONTRACT } from "../../../../../constants";
import { commonApiFetch } from "../../../../../services/api/common-api";
import { MemeLite } from "../../../settings/UserSettingsImgSelectMeme";

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
  readonly profile: IProfileAndConsolidations;
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
  const activity = searchParams.get(WALLET_ACTIVITY_FILTER_PARAM);

  const [activeFilter, setActiveFilter] =
    useState<UserPageStatsActivityWalletFilterType>(
      UserPageStatsActivityWalletFilterType.ALL
    );

  useEffect(() => {
    setActiveFilter(pathToEnum(activity ?? ""));
  }, [activity]);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
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
      pathname +
        "?" +
        createQueryString(
          WALLET_ACTIVITY_FILTER_PARAM,
          enumToPath(targetFilter)
        ),
      undefined,
      { shallow: true }
    );
  };

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const getWalletsParam = () =>
    [
      activeAddress?.toLowerCase() ??
        profile.consolidation.wallets.map((w) =>
          w.wallet.address.toLowerCase()
        ),
    ].join(",");

  const [walletsParam, setWalletsParam] = useState<string>(getWalletsParam());
  useEffect(() => {
    setWalletsParam(getWalletsParam());
    setPage(1);
  }, [activeAddress, profile]);

  useEffect(() => setPage(1), [activeFilter]);

  const {
    isFetching,
    isLoading: isFirstLoading,
    data,
  } = useQuery<Page<Transaction>>({
    queryKey: [
      QueryKey.PROFILE_TRANSACTIONS,
      {
        contract: MEMES_CONTRACT,
        page_size: `${PAGE_SIZE}`,
        page,
        wallet: walletsParam,
        filter: activeFilter,
      },
    ],
    queryFn: async () => {
      const params: Record<string, string> = {
        contract: MEMES_CONTRACT,
        wallet: walletsParam,
        page_size: `${PAGE_SIZE}`,
        page: `${page}`,
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
      setPage(1);
      setTotalPages(1);
      return;
    }
    setTotalPages(Math.ceil(data.count / PAGE_SIZE));
  }, [data?.count, data?.page, isFetching]);

  const { isFetching: isFirstLoadingMemes, data: memes } = useQuery({
    queryKey: [QueryKey.MEMES_LITE],
    queryFn: async () => {
      const memesResponse = await commonApiFetch<{
        count: number;
        data: MemeLite[];
        next: string | null;
        page: number;
      }>({
        endpoint: "memes_lite",
      });
      return memesResponse.data;
    },
  });

  return (
    <div className="tw-mt-4">
      <div className="tw-flex">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 tw-tracking-tight">
          Wallet activity
        </h3>
      </div>
      <UserPageStatsActivityWalletTableWrapper
        filter={activeFilter}
        profile={profile}
        transactions={data?.data ?? []}
        memes={memes ?? []}
        totalPages={totalPages}
        page={page}
        isFirstLoading={isFirstLoading || isFirstLoadingMemes}
        loading={isFetching}
        setPage={setPage}
        onActiveFilter={onActiveFilter}
      />
    </div>
  );
}
