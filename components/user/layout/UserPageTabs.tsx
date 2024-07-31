import { useRouter } from "next/router";
import { useContext, useEffect, useRef, useState } from "react";
import UserPageTab from "./UserPageTab";
import { AuthContext } from "../../auth/Auth";
import { useAccount } from "wagmi";

export enum UserPageTabType {
  BRAIN = "BRAIN",
  REP = "REP",
  IDENTITY = "IDENTITY",
  COLLECTED = "COLLECTED",
  STATS = "STATS",
  SUBSCRIPTIONS = "SUBSCRIPTIONS",
  PROXY = "PROXY",
  GROUPS = "GROUPS",
  WAVES = "WAVES",
}

export const USER_PAGE_TAB_META: Record<
  UserPageTabType,
  { tab: UserPageTabType; title: string; route: string }
> = {
  [UserPageTabType.BRAIN]: {
    tab: UserPageTabType.BRAIN,
    title: "Brain",
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
  [UserPageTabType.SUBSCRIPTIONS]: {
    tab: UserPageTabType.SUBSCRIPTIONS,
    title: "Subscriptions",
    route: "subscriptions",
  },
  [UserPageTabType.PROXY]: {
    tab: UserPageTabType.PROXY,
    title: "Proxy",
    route: "proxy",
  },
  [UserPageTabType.GROUPS]: {
    tab: UserPageTabType.GROUPS,
    title: "Groups",
    route: "groups",
  },
  [UserPageTabType.WAVES]: {
    tab: UserPageTabType.WAVES,
    title: "Waves",
    route: "waves",
  },
};

export default function UserPageTabs() {
  const router = useRouter();
  const { showWaves } = useContext(AuthContext);
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

  const wrapperRef = useRef<HTMLDivElement>(null);

  const getTabsToShow = () => {
    if (showWaves) return Object.values(UserPageTabType);
    return Object.values(UserPageTabType).filter(
      (tab) => ![UserPageTabType.BRAIN, UserPageTabType.WAVES].includes(tab)
    );
  };
  const [tabsToShow, setTabsToShow] = useState<UserPageTabType[]>(
    getTabsToShow()
  );
  useEffect(() => setTabsToShow(getTabsToShow()), [showWaves]);

  return (
    <div className="tw-overflow-hidden tw-border-b tw-border-iron-700 tw-border-solid tw-border-x-0 tw-border-t-0">
      <div
        className="tw-flex tw-gap-x-3 lg:tw-gap-x-4 tw-overflow-x-auto horizontal-menu-hide-scrollbar"
        aria-label="Tabs"
      >
        <div
          className="-tw-mb-px tw-flex tw-gap-x-3 lg:tw-gap-x-4"
          aria-label="Tabs"
        >
          {tabsToShow.map((tabType) => (
            <UserPageTab
              key={tabType}
              tab={tabType}
              activeTab={tab}
              parentRef={wrapperRef}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
