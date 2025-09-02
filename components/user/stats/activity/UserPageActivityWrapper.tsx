"use client";

import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import UserPageStatsActivityDistributions from "./distributions/UserPageStatsActivityDistributions";
import UserPageActivityTabs from "./tabs/UserPageActivityTabs";
import UserPageStatsActivityTDHHistory from "./tdh-history/UserPageStatsActivityTDHHistory";
import UserPageStatsActivityWallet from "./wallet/UserPageStatsActivityWallet";

export enum USER_PAGE_ACTIVITY_TAB {
  WALLET_ACTIVITY = "WALLET_ACTIVITY",
  DISTRIBUTIONS = "DISTRIBUTIONS",
  TDH_HISTORY = "TDH_HISTORY",
}

const SEARCH_PARAM_ACTIVITY = "activity";
export const WALLET_ACTIVITY_FILTER_PARAM = "wallet-activity";
export const WALLET_ACTIVITY_PAGE_PARAM = "page";
export const WALLET_DISTRIBUTION_PAGE_PARAM = "page";

const ENUM_AND_PATH: { type: USER_PAGE_ACTIVITY_TAB; path: string }[] = [
  { type: USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY, path: "wallet-activity" },
  { type: USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS, path: "distributions" },
  { type: USER_PAGE_ACTIVITY_TAB.TDH_HISTORY, path: "tdh-history" },
];

export default function UserPageActivityWrapper({
  profile,
  activeAddress,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activity = searchParams?.get(SEARCH_PARAM_ACTIVITY);

  const enumToPath = (type: USER_PAGE_ACTIVITY_TAB): string => {
    const found = ENUM_AND_PATH.find((e) => e.type === type);
    return found?.path ?? "";
  };

  const pathToEnum = (path: string): USER_PAGE_ACTIVITY_TAB => {
    const found = ENUM_AND_PATH.find((e) => e.path === path);
    return found?.type ?? USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY;
  };

  const [activeTab, setActiveTab] = useState<USER_PAGE_ACTIVITY_TAB>(
    USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY
  );

  useEffect(() => {
    setActiveTab(pathToEnum(activity ?? ""));
  }, [activity]);

  const createQueryString = useCallback(
    (name: string, value: USER_PAGE_ACTIVITY_TAB) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set(name, enumToPath(value));
      params.delete(WALLET_ACTIVITY_FILTER_PARAM);
      params.delete(WALLET_ACTIVITY_PAGE_PARAM);
      params.delete(WALLET_DISTRIBUTION_PAGE_PARAM);
      return params.toString();
    },
    [searchParams]
  );

  const onActiveTab = (tab: USER_PAGE_ACTIVITY_TAB) => {
    router.replace(
      `${pathname}?${createQueryString(SEARCH_PARAM_ACTIVITY, tab)}`,
      { scroll: false }
    );
  };

  return (
    <div className="tw-mt-7 lg:tw-mt-9">
      <UserPageActivityTabs activeTab={activeTab} setActiveTab={onActiveTab} />
      {activeTab === USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY && (
        <UserPageStatsActivityWallet
          profile={profile}
          activeAddress={activeAddress}
        />
      )}
      {activeTab === USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS && (
        <UserPageStatsActivityDistributions
          profile={profile}
          activeAddress={activeAddress}
        />
      )}
      {activeTab === USER_PAGE_ACTIVITY_TAB.TDH_HISTORY && (
        <UserPageStatsActivityTDHHistory profile={profile} />
      )}
    </div>
  );
}
