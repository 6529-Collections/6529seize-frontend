"use client";

import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";
import WebSidebar from "./sidebar/WebSidebar";
import { useSidebarController } from "../../hooks/useSidebarController";
import { useCollectionsSubmenu } from "../../hooks/useCollectionsSubmenu";
import { SIDEBAR_WIDTHS } from "../../constants/sidebar";

// const Header = dynamic(() => import("../header/Header"), {
//   ssr: false,
//   loading: () => <HeaderPlaceholder />,
// });

/**
 * WebLayout
 *
 * Top‑level web layout that renders the persistent left sidebar and positions
 * main content based on responsive sidebar state.
 *
 * Responsibilities
 * - Uses `useSidebarController` to derive mobile/desktop, collapsed vs off‑canvas,
 *   and the computed `sidebarWidth`.
 * - Integrates Collections submenu via `useCollectionsSubmenu` and offsets
 *   main content when both sidebar and submenu are visible on desktop.
 * - Delegates off‑canvas overlay behavior and accessibility to `WebSidebar`.
 *
 * This component does not manage routing; it simply offsets and renders children.
 */
interface WebLayoutProps {
  readonly children: ReactNode;
}

const WebLayout = ({ children }: WebLayoutProps) => {
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
  const rootStyle = {
    "--left-rail": sidebarWidth,
    overflowX: isMobile && isOffcanvasOpen ? "hidden" : undefined,
  } as React.CSSProperties;

  return (
    <div style={rootStyle}>
      <div className="tailwind-scope">
        <WebSidebar
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
        style={{
          ...(isMobile && isOffcanvasOpen
            ? { transform: `translateX(${sidebarWidth})` }
            : { marginLeft: mainOffset })
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default WebLayout;
