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

/**
 * DesktopLayout
 *
 * Top‑level web layout that renders the persistent left sidebar and positions
 * main content based on responsive sidebar state.
 *
 * Responsibilities
 * - Uses `useSidebarController` to derive mobile/desktop, collapsed vs off‑canvas,
 *   and the computed `sidebarWidth`.
 * - Integrates Collections submenu via `useCollectionsSubmenu` and offsets
 *   main content when both sidebar and submenu are visible on desktop.
 * - Delegates off‑canvas overlay behavior and accessibility to `DesktopSidebar`.
 *
 * This component does not manage routing; it simply offsets and renders children.
 */
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

  // Expose app left rail width as a CSS custom property for page-level sidebars
  const rootStyle: React.CSSProperties = {
    ["--left-rail" as any]: sidebarWidth,
    // Prevent horizontal scrollbars when pushing content on small desktop
    ...(isMobile && isOffcanvasOpen ? { overflowX: "hidden" } : {}),
  };

  return (
    <div style={rootStyle}>
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
        style={
          isMobile && isOffcanvasOpen
            ? ({ transform: `translateX(${sidebarWidth})` } as React.CSSProperties)
            : ({ marginLeft: mainOffset } as React.CSSProperties)
        }
      >
        {children}
      </main>
    </div>
  );
};

export default DesktopLayout;
