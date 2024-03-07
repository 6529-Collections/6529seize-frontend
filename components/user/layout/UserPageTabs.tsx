import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import UserPageTab from "./UserPageTab";

export enum UserPageTabType {
  REP = "REP",

  IDENTITY = "IDENTITY",
  COLLECTED = "COLLECTED",
  STATS = "STATS",
  MINTS = "MINTS",
}

export const USER_PAGE_TAB_META: Record<
  UserPageTabType,
  { tab: UserPageTabType; title: string; route: string }
> = {
  [UserPageTabType.REP]: {
    tab: UserPageTabType.REP,
    title: "Rep",
    route: "",
  },
  [UserPageTabType.IDENTITY]: {
    tab: UserPageTabType.IDENTITY,
    title: "Identity",
    route: "identity",
  },
  [UserPageTabType.COLLECTED]: {
    tab: UserPageTabType.COLLECTED,
    title: "Collected",
    route: "collected",
  },
  [UserPageTabType.STATS]: {
    tab: UserPageTabType.STATS,
    title: "Stats",
    route: "stats",
  },
  [UserPageTabType.MINTS]: {
    tab: UserPageTabType.MINTS,
    title: "Mints",
    route: "mints",
  },
};

export default function UserPageTabs() {
  const router = useRouter();

  const pathnameToTab = (pathname: string): UserPageTabType => {
    const regex = /\/\[user\]\/([^/?]+)/;
    const match = pathname.match(regex);
    const name = Array.isArray(match) ? match.at(1) : "";
    const tab = Object.values(UserPageTabType).find(
      (tab) =>
        USER_PAGE_TAB_META[tab].route.toLowerCase() ===
        name?.toLocaleLowerCase()
    );
    return tab ?? UserPageTabType.COLLECTED;
  };

  const [tab, setTab] = useState<UserPageTabType>(
    pathnameToTab(router.pathname)
  );

  useEffect(() => {
    setTab(pathnameToTab(router.pathname));
  }, [router.query]);

  return (
    <div className="tw-border-b tw-border-iron-700 tw-border-solid tw-border-x-0 tw-border-t-0">
      <div
        className="-tw-mb-px tw-flex tw-space-x-4 lg:tw-space-x-5"
        aria-label="Tabs"
      >
        {Object.values(UserPageTabType).map((tabType) => (
          <UserPageTab key={tabType} tab={tabType} activeTab={tab} />
        ))}
      </div>
    </div>
  );
}
