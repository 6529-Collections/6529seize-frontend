import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import UserPageTab from "./UserPageTab";
import { AuthContext } from "../../auth/Auth";

export enum UserPageTabType {
  DROPS = "DROPS",
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
  [UserPageTabType.DROPS]: {
    tab: UserPageTabType.DROPS,
    title: "Drops",
    route: "",
  },
  [UserPageTabType.REP]: {
    tab: UserPageTabType.REP,
    title: "Rep",
    route: "rep",
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
  const { canSeeDrops } = useContext(AuthContext);

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

  const getTabs = (): UserPageTabType[] => {
    const items = Object.values(UserPageTabType);
    if (canSeeDrops) {
      return items;
    }
    return items.filter((item) => item !== UserPageTabType.DROPS);
  };
  const [tabs, setTabs] = useState<UserPageTabType[]>(getTabs());
  useEffect(() => {
    setTabs(getTabs());
  }, [canSeeDrops]);

  return (
    <div className="tw-overflow-hidden tw-border-b tw-border-iron-700 tw-border-solid tw-border-x-0 tw-border-t-0">
      <div className="tw-overflow-x-auto tw-overflow-y-hidden no-scrollbar tw-pb-[1px]">
        <div
          className="-tw-mb-px tw-flex tw-gap-x-3 lg:tw-gap-x-4"
          aria-label="Tabs"
        >
          {tabs.map((tabType) => (
            <UserPageTab key={tabType} tab={tabType} activeTab={tab} />
          ))}
        </div>
      </div>
    </div>
  );
}
