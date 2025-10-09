"use client";

import React, { ReactNode, useEffect, useRef, useState } from "react";
import SmallScreenHeader from "./SmallScreenHeader";
import WebSidebar from "./sidebar/WebSidebar";
import { SIDEBAR_WIDTHS } from "../../constants/sidebar";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import { useSearchParams } from "next/navigation";
import { SidebarProvider } from "../../hooks/useSidebarState";

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
  const activeTab = searchParams?.get("tab") || "latest";

  useEffect(() => {
    if (headerRef.current) {
      registerRef("header", headerRef.current);
    }

    return () => {
      registerRef("header", null);
    };
  }, [registerRef]);

  // Reset scroll position when switching tabs
  useEffect(() => {
    const container = containerRef.current;
    if (container && activeTab) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        container.scrollTop = 0;
      });
    }
  }, [activeTab]);

  const renderSidebar = () => (
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
  );

  // Focus and ESC handling are managed inside WebSidebar on mobile

  return (
    <SidebarProvider>
      <div
        ref={containerRef}
        className={`tw-bg-black ${
          activeTab === "feed" ? "tw-overflow-hidden" : "tw-overflow-auto"
        }`}
      >
      {/* Header bar with hamburger */}
      <div ref={headerRef} className="tw-sticky tw-top-0 tw-z-30">
        <SmallScreenHeader
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
          isMenuOpen={isMenuOpen}
        />
      </div>

      {/* Sidebar and overlay are handled by WebSidebar in mobile mode */}
      {renderSidebar()}

      {/* Main content area */}
        <main className="tw-transition-opacity tw-duration-300">
          {children}
        </main>

      </div>
    </SidebarProvider>
  );
}
