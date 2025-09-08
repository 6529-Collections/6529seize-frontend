"use client";

import React, { ReactNode, useState, useEffect, useMemo } from "react";
// import dynamic from "next/dynamic";
// import HeaderPlaceholder from "../header/HeaderPlaceholder";
// import { useLayout } from "../brain/my-stream/layout/LayoutContext";
// import Breadcrumb from "../breadcrumb/Breadcrumb";
// import { useBreadcrumbs } from "../../hooks/useBreadcrumbs";
// import { useHeaderContext } from "../../contexts/HeaderContext";
import { usePathname } from "next/navigation";
import DesktopSidebar from "./sidebar/DesktopSidebar";

// const Header = dynamic(() => import("../header/Header"), {
//   ssr: false,
//   loading: () => <HeaderPlaceholder />,
// });

interface DesktopLayoutProps {
  readonly children: ReactNode;
  readonly isSmall?: boolean;
}

const DesktopLayout = ({ children, isSmall }: DesktopLayoutProps) => {
  // const { registerRef } = useLayout();
  // const { setHeaderRef } = useHeaderContext();
  const pathname = usePathname();
  
  // Start collapsed on small screens
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1280;
    }
    return false;
  });
  const [isCollectionsSubmenuOpen, setIsCollectionsSubmenuOpen] = useState(false);

  // Collections pages that should show the submenu
  const collectionsPages = [
    "/the-memes",
    "/meme-lab",
    "/gradients",
    "/6529-gradient",
    "/nextgen",
  ];

  const isOnCollectionsPage = useMemo(() => {
    return collectionsPages.some((page) => pathname?.startsWith(page));
  }, [pathname]);

  // Update submenu state when navigating to/from collection pages
  useEffect(() => {
    if (isOnCollectionsPage) {
      setIsCollectionsSubmenuOpen(true);
    }
  }, [isOnCollectionsPage]);

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
    <>
      {/* Sidebar - always visible, minimum tw-w-16 */}
      <DesktopSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isCollectionsSubmenuOpen={isCollectionsSubmenuOpen}
        onCollectionsSubmenuToggle={setIsCollectionsSubmenuOpen}
      />

      {/* Main content with responsive margins */}
      <div
        className={`tw-transition-all tw-duration-300 tw-ease-out ${
          isSidebarCollapsed ? "tw-ml-16" : "tw-ml-16 xl:tw-ml-72"
        } ${
          isCollectionsSubmenuOpen && isOnCollectionsPage ? "xl:tw-ml-[32rem]" : ""
        }`}
      >
        {/* <div
          ref={headerWrapperRef}
          className={`${
            isStreamView ? "tw-sticky tw-top-0 tw-z-50 tw-bg-black" : ""
          }`}>
         <Header isSmall={isSmall} /> 
        {!isHomePage && <Breadcrumb breadcrumbs={breadcrumbs} />} 
        </div> */}
        <main>{children}</main>
      </div>
    </>
  );
};

export default DesktopLayout;
