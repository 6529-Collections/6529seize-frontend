import { useCallback, useEffect, useState } from "react";
import UserPageActivityTabs from "./tabs/UserPageActivityTabs";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import UserPageStatsActivityWallet from "./wallet/UserPageStatsActivityWallet";
import UserPageStatsActivityDistributions from "./distributions/UserPageStatsActivityDistributions";
import UserPageStatsActivityTDHHistory from "./tdh-history/UserPageStatsActivityTDHHistory";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";

export enum USER_PAGE_ACTIVITY_TAB {
  WALLET_ACTIVITY = "WALLET_ACTIVITY",
  DISTRIBUTIONS = "DISTRIBUTIONS",
  TDH_HISTORY = "TDH_HISTORY",
}

const SEARCH_PARAM_ACTIVITY = "activity";
export const WALLET_ACTIVITY_FILTER_PARAM = "wallet-activity";


const ENUM_AND_PATH: { type: USER_PAGE_ACTIVITY_TAB; path: string }[] = [
  { type: USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY, path: "wallet-activity" },
  { type: USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS, path: "distributions" },
  { type: USER_PAGE_ACTIVITY_TAB.TDH_HISTORY, path: "tdh-history" },
];

export default function UserPageActivityWrapper({
  profile,
  activeAddress,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly activeAddress: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activity = searchParams.get(SEARCH_PARAM_ACTIVITY);

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
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, enumToPath(value));
      if (value !== USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY) {
        params.delete(WALLET_ACTIVITY_FILTER_PARAM);
      }
      return params.toString();
    },
    [searchParams]
  );

  const onActiveTab = (tab: USER_PAGE_ACTIVITY_TAB) => {
    router.replace(
      pathname + "?" + createQueryString(SEARCH_PARAM_ACTIVITY, tab),
      undefined,
      { shallow: true }
    );
  };

  return (
    <div className="tw-mt-6 lg:tw-mt-8">
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
