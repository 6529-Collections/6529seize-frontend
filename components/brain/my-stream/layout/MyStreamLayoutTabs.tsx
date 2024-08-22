import { useRouter } from "next/router";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../../auth/Auth";
import MyStreamLayoutTab from "./MyStreamLayoutTab";

export enum MyStreamTabType {
  MY_STREAM = "MY_STREAM",
  NOTIFICATIONS = "NOTIFICATIONS",
}

export const MY_STREAM_TAB_META: Record<
  MyStreamTabType,
  { tab: MyStreamTabType; title: string; route: string }
> = {
  [MyStreamTabType.MY_STREAM]: {
    tab: MyStreamTabType.MY_STREAM,
    title: "My Stream",
    route: "my-stream",
  },
  [MyStreamTabType.NOTIFICATIONS]: {
    tab: MyStreamTabType.NOTIFICATIONS,
    title: "Notifications",
    route: "my-stream/notifications",
  },
};

export default function MyStreamLayoutTabs() {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const router = useRouter();
  const pathnameToTab = (pathname: string): MyStreamTabType => {
    const tab = Object.values(MyStreamTabType).find(
      (tab) =>
        `/${MY_STREAM_TAB_META[tab].route.toLowerCase()}` ===
        pathname?.toLocaleLowerCase()
    );
    return tab ?? MyStreamTabType.MY_STREAM;
  };

  const [tab, setTab] = useState<MyStreamTabType>(
    pathnameToTab(router.pathname)
  );

  useEffect(() => {
    setTab(pathnameToTab(router.pathname));
  }, [router.query]);

  const getTabsToShow = () => {
    if (!!connectedProfile?.profile?.handle && !activeProfileProxy)
      return Object.values(MyStreamTabType);
    return Object.values(MyStreamTabType).filter(
      (tab) => ![MyStreamTabType.NOTIFICATIONS].includes(tab)
    );
  };
  const [tabsToShow, setTabsToShow] = useState<MyStreamTabType[]>(
    getTabsToShow()
  );
  useEffect(
    () => setTabsToShow(getTabsToShow()),
    [connectedProfile, activeProfileProxy]
  );

  const wrapperRef = useRef<HTMLDivElement>(null);
  return (
    <div className="tw-overflow-hidden tw-border-b tw-border-iron-700 tw-border-solid tw-border-x-0 tw-border-t-0">
      <div
        className="tw-relative tw-z-10 tw-flex tw-gap-x-3 lg:tw-gap-x-4 tw-overflow-x-auto horizontal-menu-hide-scrollbar"
        aria-label="Tabs"
      >
        <div
          className="-tw-mb-px tw-flex tw-gap-x-3 lg:tw-gap-x-4"
          aria-label="Tabs"
        >
          {tabsToShow.map((tabType) => (
            <MyStreamLayoutTab
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
