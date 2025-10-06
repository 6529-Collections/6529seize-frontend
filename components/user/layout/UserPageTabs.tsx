"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import useCapacitor from "@/hooks/useCapacitor";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
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

  const [activeTab, setActiveTab] = useState<UserPageTabKey>(
    resolveTabFromPath(pathname)
  );

  useEffect(() => {
    setActiveTab(resolveTabFromPath(pathname));
  }, [pathname]);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const visibleTabs = useMemo(
    () => filterVisibleTabs(USER_PAGE_TABS, visibilityContext),
    [visibilityContext]
  );

  return (
    <div className="tw-overflow-hidden tw-border-b tw-border-iron-700 tw-border-solid tw-border-x-0 tw-border-t-0">
      <div
        className="tw-flex tw-gap-x-3 lg:tw-gap-x-4 tw-overflow-x-auto horizontal-menu-hide-scrollbar"
        aria-label="Tabs">
        <div
          ref={wrapperRef}
          className="-tw-mb-px tw-flex tw-gap-x-3 lg:tw-gap-x-4"
          aria-label="Tabs">
          {visibleTabs.map((tabConfig) => (
            <UserPageTab
              key={tabConfig.id}
              tab={tabConfig}
              activeTabId={activeTab}
              parentRef={wrapperRef}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
