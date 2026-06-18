"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { SupportedLocale } from "@/i18n/locales";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  SEARCH_PARAM_ACTIVITY,
  WALLET_ACTIVITY_FILTER_PARAM,
  WALLET_ACTIVITY_PAGE_PARAM,
  WALLET_DISTRIBUTION_PAGE_PARAM,
} from "./activity.helpers";
import { USER_PAGE_ACTIVITY_TAB } from "./activity.types";
import UserPageStatsActivityDistributions from "./distributions/UserPageStatsActivityDistributions";
import {
  getActivityPanelId,
  getActivityTabId,
} from "./tabs/activity-tabs.helpers";
import UserPageActivityTabs from "./tabs/UserPageActivityTabs";
import UserPageStatsActivityTDHHistory from "./tdh-history/UserPageStatsActivityTDHHistory";
import UserPageStatsActivityWallet from "./wallet/UserPageStatsActivityWallet";

const ENUM_AND_PATH: { type: USER_PAGE_ACTIVITY_TAB; path: string }[] = [
  { type: USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY, path: "wallet-activity" },
  { type: USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS, path: "distributions" },
  { type: USER_PAGE_ACTIVITY_TAB.TDH_HISTORY, path: "tdh-history" },
];

const enumToPath = (type: USER_PAGE_ACTIVITY_TAB): string => {
  const found = ENUM_AND_PATH.find((entry) => entry.type === type);
  return found?.path ?? "";
};

const pathToEnum = (path: string): USER_PAGE_ACTIVITY_TAB => {
  const found = ENUM_AND_PATH.find((entry) => entry.path === path);
  return found?.type ?? USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY;
};

export default function UserPageActivityWrapper({
  profile,
  activeAddress,
  locale,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
  readonly locale: SupportedLocale;
}) {
  return (
    <Suspense fallback={null}>
      <UserPageActivityContent
        profile={profile}
        activeAddress={activeAddress}
        locale={locale}
      />
    </Suspense>
  );
}

function UserPageActivityContent({
  profile,
  activeAddress,
  locale,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
  readonly locale: SupportedLocale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activity = searchParams.get(SEARCH_PARAM_ACTIVITY);
  const activeTab = pathToEnum(activity ?? "");

  const createQueryString = (name: string, value: USER_PAGE_ACTIVITY_TAB) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, enumToPath(value));
    params.delete(WALLET_ACTIVITY_FILTER_PARAM);
    params.delete(WALLET_ACTIVITY_PAGE_PARAM);
    params.delete(WALLET_DISTRIBUTION_PAGE_PARAM);
    return params.toString();
  };

  const onActiveTab = (tab: USER_PAGE_ACTIVITY_TAB) => {
    router.replace(
      `${pathname}?${createQueryString(SEARCH_PARAM_ACTIVITY, tab)}`,
      { scroll: false }
    );
  };

  return (
    <div className="tw-mt-7 lg:tw-mt-9">
      <UserPageActivityTabs
        activeTab={activeTab}
        setActiveTab={onActiveTab}
        locale={locale}
      />
      {activeTab === USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY && (
        <section
          role="tabpanel"
          id={getActivityPanelId(USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY)}
          aria-labelledby={getActivityTabId(
            USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY
          )}
          tabIndex={0}
        >
          <UserPageStatsActivityWallet
            profile={profile}
            activeAddress={activeAddress}
            locale={locale}
          />
        </section>
      )}
      {activeTab === USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS && (
        <section
          role="tabpanel"
          id={getActivityPanelId(USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS)}
          aria-labelledby={getActivityTabId(
            USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS
          )}
          tabIndex={0}
        >
          <UserPageStatsActivityDistributions
            profile={profile}
            activeAddress={activeAddress}
            locale={locale}
          />
        </section>
      )}
      {activeTab === USER_PAGE_ACTIVITY_TAB.TDH_HISTORY && (
        <section
          role="tabpanel"
          id={getActivityPanelId(USER_PAGE_ACTIVITY_TAB.TDH_HISTORY)}
          aria-labelledby={getActivityTabId(USER_PAGE_ACTIVITY_TAB.TDH_HISTORY)}
          tabIndex={0}
        >
          <UserPageStatsActivityTDHHistory profile={profile} locale={locale} />
        </section>
      )}
    </div>
  );
}
