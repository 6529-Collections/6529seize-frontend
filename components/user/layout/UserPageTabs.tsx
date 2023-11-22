import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import UserPageTab from "./UserPageTab";

export enum UserPageTabType {
  COLLECTED = "COLLECTED",
  STATS = "STATS",
  IDENTITY = "IDENTITY",
}

export const USER_PAGE_TAB_META: Record<UserPageTabType, { tab: UserPageTabType, title: string, route: string }> = {
  [UserPageTabType.COLLECTED]: { tab: UserPageTabType.COLLECTED, title: "Collected", route: "" },
  [UserPageTabType.STATS]: { tab: UserPageTabType.STATS, title: "Stats", route: "stats" },
  [UserPageTabType.IDENTITY]: { tab: UserPageTabType.IDENTITY, title: "Identity", route: "identity" },
}

export default function UserPageTabs() {
  const router = useRouter();
  const user = router.query.user as string;

  const pathnameToTab = (pathname: string): UserPageTabType => {
    const regex = /\/\[user\]\/([^/?]+)/;
    const match = pathname.match(regex);
    const name = Array.isArray(match) ? match.at(1) : '';
    if (name === "") {
      return UserPageTabType.COLLECTED;
    }
    else if (name === "stats") {
      return UserPageTabType.STATS;
    }

    else if (name === "identity") {
      return UserPageTabType.IDENTITY;
    }

    return UserPageTabType.COLLECTED;
  }

  const [tab, setTab] = useState<UserPageTabType>(pathnameToTab(router.pathname));

  const goToTab = (tab: UserPageTabType) => {
    router.push(
      {
        pathname: `/${user}/${USER_PAGE_TAB_META[tab].route}`,
        query: router.query.address ? { address: router.query.address } : {},
      }
    );
    setTab(tab);
  }

  return <div className="tw-inline-flex tw-w-full tw-space-x-4">
    {Object.values(UserPageTabType).map((tabType) => <UserPageTab key={tabType} tab={tabType} activeTab={tab} goToTab={goToTab} />)}
  </div>
}