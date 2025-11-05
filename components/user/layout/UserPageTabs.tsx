"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import useCapacitor from "@/hooks/useCapacitor";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePathname } from "next/navigation";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import UserPageTab from "./UserPageTab";

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
  FOLLOWERS = "FOLLOWERS",
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
  [UserPageTabType.FOLLOWERS]: {
    tab: UserPageTabType.FOLLOWERS,
    title: "Followers",
    route: "followers",
  },
};

export default function UserPageTabs() {
  const pathname = usePathname() ?? "";
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const { showWaves } = useContext(AuthContext);
  const pathnameToTab = (pathname: string): UserPageTabType => {
    const segments = pathname.split("/").filter(Boolean);
    const name = segments[1] ?? "";
    const tab = Object.values(UserPageTabType).find(
      (tab) =>
        USER_PAGE_TAB_META[tab].route.toLowerCase() === name?.toLowerCase()
    );
    return tab ?? UserPageTabType.COLLECTED;
  };

  const [tab, setTab] = useState<UserPageTabType>(pathnameToTab(pathname));

  useEffect(() => {
    setTab(pathnameToTab(pathname));
  }, [pathname]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const getTabsToShow = useCallback(() => {
    let allTabs = Object.values(UserPageTabType);
    if (capacitor.isIos && country !== "US") {
      allTabs = allTabs.filter((tab) => tab !== UserPageTabType.SUBSCRIPTIONS);
    }
    if (showWaves) return allTabs;
    return allTabs.filter(
      (tab) => ![UserPageTabType.BRAIN, UserPageTabType.WAVES].includes(tab)
    );
  }, [capacitor.isIos, country, showWaves]);
  const [tabsToShow, setTabsToShow] = useState<UserPageTabType[]>(
    getTabsToShow()
  );
  useEffect(() => setTabsToShow(getTabsToShow()), [getTabsToShow]);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    const contentContainer = contentContainerRef.current;
    if (!container) return;

    checkScroll();
    container.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    resizeObserver.observe(container);
    if (contentContainer) {
      resizeObserver.observe(contentContainer);
    }

    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        checkScroll();
      });
    });
  }, [tabsToShow]);

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: -150, behavior: "smooth" });
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: 150, behavior: "smooth" });
  };

  return (
    <div className="tw-relative tw-overflow-hidden tw-border-b tw-border-iron-700 tw-border-solid tw-border-x-0 tw-border-t-0">
      <div
        ref={scrollContainerRef}
        className="tw-w-full tw-overflow-x-auto tw-overflow-y-hidden [touch-action:pan-x] [&::-webkit-scrollbar]:tw-hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        aria-label="Tabs">
        <div
          ref={contentContainerRef}
          className="-tw-mb-px tw-flex tw-gap-x-3 lg:tw-gap-x-4 tw-min-w-max"
          aria-label="Tabs">
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
      {canScrollLeft && (
        <>
          <div className="tw-absolute tw-left-0 tw-top-0 tw-bottom-0 tw-w-24 tw-pointer-events-none tw-z-10 tw-bg-gradient-to-r tw-from-black tw-via-black/40 tw-to-black/0" />
          <button
            onClick={scrollLeft}
            aria-label="Scroll tabs left"
            className="tw-absolute tw-left-0 tw-top-1/2 tw--translate-y-1/2 tw-z-20 tw-inline-flex tw-items-center tw-justify-start tw-group tw-p-0 tw-h-10 tw-w-10 tw-bg-transparent tw-border-none tw-outline-none">
            <FontAwesomeIcon
              icon={faChevronLeft}
              className="tw-h-6 tw-w-6 tw-text-iron-200 group-hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out"
            />
          </button>
        </>
      )}
      {canScrollRight && (
        <>
          <div className="tw-absolute tw-right-0 tw-top-0 tw-bottom-0 tw-w-24 tw-pointer-events-none tw-z-10 tw-bg-gradient-to-l tw-from-black tw-via-black/40 tw-to-black/0" />
          <button
            onClick={scrollRight}
            aria-label="Scroll tabs right"
            className="tw-absolute tw-right-0 tw-top-1/2 tw--translate-y-1/2 tw-z-20 tw-inline-flex tw-items-center tw-justify-end tw-group tw-p-0 tw-h-10 tw-w-10 tw-bg-transparent tw-border-none tw-outline-none">
            <FontAwesomeIcon
              icon={faChevronRight}
              className="tw-h-6 tw-w-6 tw-text-iron-200 group-hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out"
            />
          </button>
        </>
      )}
    </div>
  );
}
