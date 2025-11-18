"use client";

import { useHeaderContext } from "@/contexts/HeaderContext";
import { useSearchParams } from "next/navigation";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { SIDEBAR_WIDTHS } from "../../constants/sidebar";
import { SidebarProvider } from "../../hooks/useSidebarState";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import SmallScreenHeader from "./SmallScreenHeader";
import WebSidebar from "./sidebar/WebSidebar";

interface Props {
  readonly children: ReactNode;
}

export default function SmallScreenLayout({ children }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { registerRef } = useLayout();
  const { setHeaderRef } = useHeaderContext();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") || "latest";

  const headerWrapperRef = useCallback(
    (node: HTMLDivElement | null) => {
      registerRef("header", node);
      setHeaderRef(node);
    },
    [registerRef, setHeaderRef]
  );

  useEffect(() => {
    return () => {
      registerRef("header", null);
      setHeaderRef(null);
    };
  }, [registerRef, setHeaderRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (container && activeTab) {
      requestAnimationFrame(() => {
        container.scrollTop = 0;
      });
    }
  }, [activeTab]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <SidebarProvider>
      <div
        ref={containerRef}
        className={`tw-bg-black ${
          activeTab === "feed" ? "tw-overflow-hidden" : "tw-overflow-auto"
        }`}>
        <div ref={headerWrapperRef}>
          <SmallScreenHeader
            onMenuToggle={toggleMenu}
            isMenuOpen={isMenuOpen}
          />
        </div>

        <div className="tailwind-scope">
          <WebSidebar
            isCollapsed={false}
            onToggle={toggleMenu}
            isMobile={true}
            isOffcanvasOpen={isMenuOpen}
            onCloseOffcanvas={closeMenu}
            sidebarWidth={SIDEBAR_WIDTHS.EXPANDED}
          />
        </div>

        <main className="tw-transition-opacity tw-duration-300">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
