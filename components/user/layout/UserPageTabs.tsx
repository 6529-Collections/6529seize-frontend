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
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import UserPageTab from "./UserPageTab";
import {
  DEFAULT_USER_PAGE_TAB,
  USER_PAGE_TABS,
  type UserPageTabConfig,
  type UserPageTabKey,
  type UserPageVisibilityContext,
  getUserPageTabByRoute,
} from "./userTabs.config";

const DEFAULT_TAB = DEFAULT_USER_PAGE_TAB;

const getVisibilityContext = ({
  showWaves,
  capacitorIsIos,
  country,
}: {
  readonly showWaves: boolean;
  readonly capacitorIsIos: boolean;
  readonly country: string | null;
}): UserPageVisibilityContext => ({
  showWaves,
  hideSubscriptions: capacitorIsIos && country !== "US",
});

const resolveTabFromPath = (pathname: string): UserPageTabKey => {
  const segments = pathname.split("/").filter(Boolean);
  const routeSegment = segments[1] ?? "";
  const match = getUserPageTabByRoute(routeSegment);
  return match?.id ?? DEFAULT_TAB;
};

const filterVisibleTabs = (
  tabs: readonly UserPageTabConfig[],
  context: UserPageVisibilityContext
) =>
  tabs.filter((tab) => (tab.isVisible ? tab.isVisible(context) : true));

export default function UserPageTabs() {
  const pathname = usePathname() ?? "";
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const { showWaves } = useContext(AuthContext);

  const visibilityContext = useMemo(
    () =>
      getVisibilityContext({
        showWaves,
        capacitorIsIos: capacitor.isIos,
        country: country ?? null,
      }),
    [capacitor.isIos, country, showWaves]
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const resolvedTabFromPath = useMemo<UserPageTabKey>(
    () => resolveTabFromPath(pathname),
    [pathname]
  );

  const visibleTabs = useMemo(
    () => filterVisibleTabs(USER_PAGE_TABS, visibilityContext),
    [visibilityContext]
  );

  const activeTab = useMemo<UserPageTabKey>(() => {
    if (visibleTabs.some((tab) => tab.id === resolvedTabFromPath)) {
      return resolvedTabFromPath;
    }

    const firstVisibleTab = visibleTabs[0]?.id;
    return firstVisibleTab ?? DEFAULT_TAB;
  }, [resolvedTabFromPath, visibleTabs]);

  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

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
  }, [checkScroll]);

  useEffect(() => {
    if (!visibleTabs.length) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        checkScroll();
      });
    });
  }, [checkScroll, visibleTabs]);

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
          {visibleTabs.map((tabConfig) => (
            <UserPageTab
              key={tabConfig.id}
              tab={tabConfig}
              activeTabId={activeTab}
              parentRef={scrollContainerRef}
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
