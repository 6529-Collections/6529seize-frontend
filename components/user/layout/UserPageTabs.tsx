import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import UserPageTab from "./UserPageTab";

export enum UserPageTabType {
  BRAIN = "BRAIN",
  REP = "REP",
  IDENTITY = "IDENTITY",
  COLLECTED = "COLLECTED",
  STATS = "STATS",
  SUBSCRIPTIONS = "SUBSCRIPTIONS",
  PROXY = "PROXY",
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

  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div className="tw-overflow-hidden tw-border-b tw-border-iron-700 tw-border-solid tw-border-x-0 tw-border-t-0">
      <div
        className="tw-overflow-x-auto tw-overflow-y-hidden no-scrollbar tw-pb-[1px]"
        ref={wrapperRef}
      >
        <div
          className="-tw-mb-px tw-flex tw-gap-x-3 lg:tw-gap-x-4"
          aria-label="Tabs"
        >
          {Object.values(UserPageTabType).map((tabType) => (
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
