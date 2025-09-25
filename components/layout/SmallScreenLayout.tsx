"use client";

import React, { ReactNode, useEffect, useRef, useState } from "react";
import SmallScreenHeader from "./SmallScreenHeader";
import WebSidebar from "./sidebar/WebSidebar";
import { SIDEBAR_WIDTHS } from "../../constants/sidebar";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import { useSearchParams } from "next/navigation";

interface Props {
  readonly children: ReactNode;
}

export default function SmallScreenLayout({ children }: Props) {
  // Simple menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { registerRef } = useLayout();
  const headerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();

  // Get tab from URL
  const activeTab = searchParams?.get('tab') || 'latest';


  useEffect(() => {
    registerRef("header", headerRef.current);
    return () => {
      registerRef("header", null);
    };
  }, [registerRef]);

  // Reset scroll position when switching tabs
  useEffect(() => {
    if (containerRef.current && activeTab) {
      containerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  return (
    <div ref={containerRef} className={`tw-h-screen ${activeTab === 'feed' ? 'tw-overflow-hidden' : 'tw-overflow-auto'}`}>
      {/* Header bar with hamburger */}
      <div ref={headerRef} className="tw-sticky tw-top-0 tw-z-30">
        <SmallScreenHeader
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
          isMenuOpen={isMenuOpen}
        />
      </div>

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

      {/* Main content area */}
      <main className={`tw-transition-opacity tw-duration-300 ${isMenuOpen ? 'tw-opacity-40 tw-pointer-events-none' : ''}`}>
        {children}
      </main>
    </div>
  );
}
