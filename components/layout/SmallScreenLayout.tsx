"use client";

import { useCallback, useState } from "react";
import { SIDEBAR_WIDTHS } from "../../constants/sidebar";
import { SidebarProvider } from "../../hooks/useSidebarState";
import WebSidebar from "./sidebar/WebSidebar";
import SmallScreenLayoutHeader from "./SmallScreenLayoutHeader";
import type { ReactNode } from "react";

interface Props {
  readonly children: ReactNode;
}

export default function SmallScreenLayout({ children }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <SidebarProvider>
      <div className="tw-overflow-auto tw-bg-black">
        <SmallScreenLayoutHeader
          onMenuToggle={toggleMenu}
          isMenuOpen={isMenuOpen}
        />

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
