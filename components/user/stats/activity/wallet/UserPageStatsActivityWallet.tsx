import { useQuery } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import { commonApiFetch } from "../../../../../services/api/common-api";
import { MemeLite } from "../../../settings/UserSettingsImgSelectMeme";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import UserPageStatsActivityWalletFilter from "./filter/UserPageStatsActivityWalletFilter";
import { useRouter } from "next/router";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { WALLET_ACTIVITY_FILTER_PARAM } from "../UserPageActivityWrapper";
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
  readonly profile: IProfileAndConsolidations;
  readonly activeAddress: string | null;
}) {
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

  return (
    <div className="tw-mt-2 lg:tw-mt-4">
      <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 tw-tracking-tight">
        Wallet activity
      </h3>
      <UserPageStatsActivityWalletFilter
        activeFilter={activeFilter}
        setActiveFilter={onActiveFilter}
      />
      <div className="tw-mt-2 lg:tw-mt-4">
        <UserPageStatsActivityWalletTableWrapper
          filter={activeFilter}
          profile={profile}
          activeAddress={activeAddress}
        />
      </div>
    </div>
  );
}
