"use client";

import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";
import DesktopSidebar from "./sidebar/DesktopSidebar";
import { useSidebarController } from "../../hooks/useSidebarController";
import { useCollectionsSubmenu } from "../../hooks/useCollectionsSubmenu";
import { SIDEBAR_WIDTHS } from "../../constants/sidebar";

// const Header = dynamic(() => import("../header/Header"), {
//   ssr: false,
//   loading: () => <HeaderPlaceholder />,
// });

interface DesktopLayoutProps {
  readonly children: ReactNode;
  readonly isSmall?: boolean;
}

const DesktopLayout = ({ children }: DesktopLayoutProps) => {
  const pathname = usePathname();
  const {
    isMobile,
    isCollapsed,
    isOffcanvasOpen,
    toggleCollapsed,
    closeOffcanvas,
    sidebarWidth,
  } = useSidebarController();

  const { isSubmenuOpen, toggleSubmenu, isOnCollectionsPage } =
    useCollectionsSubmenu(pathname, isMobile);

  // Calculate main content offset (always account for sidebar width)
  const mainOffset =
    isOnCollectionsPage && isSubmenuOpen && !isMobile
      ? `calc(${sidebarWidth} + ${SIDEBAR_WIDTHS.SUBMENU})`
      : sidebarWidth;

  // Commented out for now - will be used when header is re-enabled
  // const breadcrumbs = useBreadcrumbs();
  // const isHomePage = pathname === "/";
  // const isStreamView = pathname?.startsWith("/my-stream");
  // const headerWrapperRef = useCallback(
  //   (node: HTMLDivElement | null) => {
  //     registerRef("header", node);
  //     setHeaderRef(node);
  //   },
  //   [registerRef, setHeaderRef]
  // );

  return (
    <div>
      <div className="tailwind-scope">
        <DesktopSidebar
          isCollapsed={isCollapsed}
          onToggle={toggleCollapsed}
          isCollectionsSubmenuOpen={isSubmenuOpen}
          onCollectionsSubmenuToggle={toggleSubmenu}
          isMobile={isMobile}
          isOffcanvasOpen={isOffcanvasOpen}
          onCloseOffcanvas={closeOffcanvas}
          sidebarWidth={sidebarWidth}
        />
      </div>

      <main
        className="tw-transition-all tw-duration-300 tw-ease-out"
        style={{ marginLeft: mainOffset }}
      >
        {children}
      </main>
    </div>
  );
};

export default DesktopLayout;
