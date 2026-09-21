"use client";

import { useEffect, useMemo } from "react";
import { SIDEBAR_WIDTHS } from "../../constants/sidebar";
import { useSidebarController } from "../../hooks/useSidebarController";
import { SidebarProvider, useSidebarState } from "../../hooks/useSidebarState";
import WebSidebar from "./sidebar/WebSidebar";
import SmallScreenLayoutHeader from "./SmallScreenLayoutHeader";
import type { CSSProperties, ReactNode } from "react";

const DESKTOP_MAX_WIDTH = 1324;

interface WebLayoutProps {
  readonly children: ReactNode;
  readonly isSmall?: boolean | undefined;
}

const WebLayoutContent = ({ children, isSmall = false }: WebLayoutProps) => {
  const {
    isMobile,
    isNarrow,
    isCollapsed,
    isOffcanvasOpen,
    toggleCollapsed,
    closeOffcanvas,
    sidebarWidth,
  } = useSidebarController();
  const { isRightSidebarOpen } = useSidebarState();

  // Changing responsive chrome must not remount page state or live uploads.
  // Close the old menu just as the previous separate layout did on unmount.
  useEffect(() => {
    closeOffcanvas();
  }, [isSmall, closeOffcanvas]);

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
          ? "tw-overflow-auto tw-bg-black"
          : "layout-root tw-relative tw-flex tw-w-full tw-justify-between"
      }
      style={isSmall ? undefined : cssVars}
      data-mobile={isMobile}
      data-narrow={isNarrow}
      data-offcanvas={isOffcanvasOpen}
      data-right-open={isRightSidebarOpen}
      data-small={isSmall ? "true" : "false"}
    >
      {isSmall && (
        <SmallScreenLayoutHeader
          onMenuToggle={toggleCollapsed}
          isMenuOpen={isOffcanvasOpen}
        />
      )}
      <div className="tailwind-scope">
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
