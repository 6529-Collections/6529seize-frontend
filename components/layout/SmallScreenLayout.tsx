"use client";

import React, { ReactNode, useState } from "react";
import SmallScreenHeader from "./SmallScreenHeader";
import WebSidebar from "./sidebar/WebSidebar";
import { SIDEBAR_WIDTHS } from "../../constants/sidebar";

interface Props {
  readonly children: ReactNode;
}

export default function SmallScreenLayout({ children }: Props) {
  // Simple menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="tw-flex tw-flex-col tw-h-screen">
      {/* Simple header bar with hamburger */}
      <SmallScreenHeader
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        isMenuOpen={isMenuOpen}
      />

      {/* Simple overlay sidebar */}
      {isMenuOpen && (
        <div className="tailwind-scope">
          <WebSidebar
            isCollapsed={false}
            onToggle={() => setIsMenuOpen(!isMenuOpen)}
            isMobile={true}
            isOffcanvasOpen={isMenuOpen}
            onCloseOffcanvas={() => setIsMenuOpen(false)}
            sidebarWidth={SIDEBAR_WIDTHS.EXPANDED}
          />
        </div>
      )}

      {/* Main content that grows to fill space */}
      <main className={`tw-flex-1 tw-overflow-auto tw-transition-opacity tw-duration-300 ${isMenuOpen ? 'tw-opacity-40 tw-pointer-events-none' : ''}`}>
        {children}
      </main>
    </div>
  );
}
