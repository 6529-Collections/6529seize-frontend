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
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
      <DesktopSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isCollectionsSubmenuOpen={isCollectionsSubmenuOpen}
        onCollectionsSubmenuToggle={setIsCollectionsSubmenuOpen}
      />
      <div
        className="tw-transition-all tw-duration-300 tw-ease-out"
        style={{
          marginLeft: `${
            (isSidebarCollapsed ? 64 : 288) + 
            (isCollectionsSubmenuOpen && isOnCollectionsPage ? 256 : 0)
          }px`
        }}
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
