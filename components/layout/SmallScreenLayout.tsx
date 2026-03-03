"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useHeaderContext } from "@/contexts/HeaderContext";
import { SIDEBAR_WIDTHS } from "../../constants/sidebar";
import { SidebarProvider } from "../../hooks/useSidebarState";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import WebSidebar from "./sidebar/WebSidebar";
import SmallScreenHeader from "./SmallScreenHeader";
import type { ReactNode } from "react";

interface Props {
  readonly children: ReactNode;
}

export default function SmallScreenLayout({ children }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { registerRef } = useLayout();
  const { setHeaderRef } = useHeaderContext();
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <SidebarProvider>
      <div ref={containerRef} className="tw-overflow-auto tw-bg-black">
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
