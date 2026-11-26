"use client";

import { useEffect, useLayoutEffect, useMemo } from "react";
import { commitWaveNavigationTransition } from "@/helpers/waves/wave-navigation-transition";
import { useParams, usePathname } from "next/navigation";
import { isUserProfilePage } from "../user/layout/userTabs.config";
import { PHONE_WAVES_LAYOUT_QUERY } from "@/constants/waves-layout";
import { getWaveIdFromPathname } from "@/helpers/navigation.helpers";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { SIDEBAR_WIDTHS } from "../../constants/sidebar";
import { useSidebarController } from "../../hooks/useSidebarController";
import { SidebarProvider, useSidebarState } from "../../hooks/useSidebarState";
import WebSidebar from "./sidebar/WebSidebar";
import SmallScreenLayoutHeader from "./SmallScreenLayoutHeader";
import { isSmallWebStartupExpected } from "./smallWebStartup";
import type { CSSProperties, ReactNode } from "react";

const DESKTOP_MAX_WIDTH = 1324;

interface WebLayoutProps {
  readonly children: ReactNode;
  readonly isSmall?: boolean | undefined;
}

const WebLayoutContent = ({ children, isSmall = false }: WebLayoutProps) => {
  const {
    isSidebarReady,
    isMobile,
    isNarrow,
    isCollapsed,
    isOffcanvasOpen,
    toggleCollapsed,
    closeOffcanvas,
    sidebarWidth,
  } = useSidebarController();
  const { isRightSidebarOpen } = useSidebarState();
  const pathname = usePathname();
  const params = useParams();
  const isPhoneWidth = useMediaQuery(PHONE_WAVES_LAYOUT_QUERY);
  useLayoutEffect(() => {
    if (isSmall && isPhoneWidth) {
      commitWaveNavigationTransition(null, pathname);
    }
  }, [pathname, isSmall, isPhoneWidth]);
  const showSiteHeader =
    isSmall && !(isPhoneWidth && getWaveIdFromPathname(pathname));
  const smallWebOverflow =
    pathname === "/the-memes" ||
    /^\/the-memes\/\d+\/?$/.test(pathname) ||
    isUserProfilePage(pathname, params["user"])
      ? "tw-overflow-x-clip"
      : "tw-overflow-auto";

  // Changing responsive chrome must not remount page state or live uploads.
  // Close the old menu just as the previous separate layout did on unmount.
  useEffect(() => {
    closeOffcanvas();
  }, [isSmall, closeOffcanvas]);

  useEffect(() => {
    if (isSmall || !isSmallWebStartupExpected()) {
      // Keep the override through the hydration defaults, but release it when
      // React takes over or capabilities changed to desktop during loading.
      delete document.documentElement.dataset["smallWebStartup"];
      delete document.documentElement.dataset["smallWebBanner"];
    }
  }, [isSmall, isMobile, isNarrow, isSidebarReady]);

  const cssVars = useMemo(
    () =>
      ({
        "--sidebar-width": sidebarWidth,
        "--collapsed-width": SIDEBAR_WIDTHS.COLLAPSED,
        "--expanded-width": SIDEBAR_WIDTHS.EXPANDED,
        "--layout-max": `${DESKTOP_MAX_WIDTH}px`,
      }) as CSSProperties,
    [sidebarWidth]
  );

  return (
    <div
      className={
        isSmall
          ? `${smallWebOverflow} tw-bg-black`
          : "layout-root tw-relative tw-flex tw-w-full tw-justify-between"
      }
      style={isSmall ? undefined : cssVars}
      data-phone-wave-page={isSmall && isPhoneWidth ? true : undefined}
      data-mobile={isMobile}
      data-narrow={isNarrow}
      data-offcanvas={isOffcanvasOpen}
      data-right-open={isRightSidebarOpen}
      data-small={isSmall ? "true" : "false"}
      data-sidebar-ready={isSidebarReady}
    >
      <SmallScreenLayoutHeader
        active={showSiteHeader}
        onMenuToggle={toggleCollapsed}
        isMenuOpen={isOffcanvasOpen}
      />
      <div className="tailwind-scope" data-web-sidebar="true">
        <WebSidebar
          key={isSmall ? "small" : "desktop"}
          isCollapsed={isSmall ? false : isCollapsed}
          onToggle={toggleCollapsed}
          isMobile={isSmall || isMobile}
          isNarrow={isSmall ? false : isNarrow}
          isOffcanvasOpen={isOffcanvasOpen}
          onCloseOffcanvas={closeOffcanvas}
          sidebarWidth={isSmall ? SIDEBAR_WIDTHS.EXPANDED : sidebarWidth}
        />
      </div>
      <main
        className={
          isSmall
            ? "tw-transition-opacity tw-duration-300"
            : "layout-main tw-min-w-0 tw-flex-1"
        }
        data-mobile={isMobile}
        data-narrow={isNarrow}
        data-offcanvas={isOffcanvasOpen}
        data-right-open={isRightSidebarOpen}
      >
        {children}
      </main>
    </div>
  );
};

const WebLayout = ({ children, isSmall = false }: WebLayoutProps) => (
  <SidebarProvider>
    <WebLayoutContent isSmall={isSmall}>{children}</WebLayoutContent>
  </SidebarProvider>
);

export default WebLayout;
