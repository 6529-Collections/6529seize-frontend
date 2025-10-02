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
  const sidebarRef = useRef<HTMLElement | null>(null);

  let searchParams: ReturnType<typeof useSearchParams> | null = null;
  try {
    searchParams = useSearchParams();
  } catch (error) {
    searchParams = null;
  }

  // Get tab from URL
  const activeTab = searchParams?.get("tab") || "latest";

  useEffect(() => {
    try {
      if (headerRef.current) {
        registerRef("header", headerRef.current);
      }
    } catch (error) {
      console.error('Failed to register header ref:', error);
    }

    return () => {
      try {
        registerRef("header", null);
      } catch (error) {
        console.error('Failed to unregister header ref:', error);
      }
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

  const renderSidebar = () => {
    try {
      return (
        <WebSidebar
          isCollapsed={false}
          onToggle={() => setIsMenuOpen(!isMenuOpen)}
          isMobile={true}
          isOffcanvasOpen={isMenuOpen}
          onCloseOffcanvas={() => setIsMenuOpen(false)}
          sidebarWidth={SIDEBAR_WIDTHS.EXPANDED}
        />
      );
    } catch (error) {
      return null;
    }
  };

  // Focus management when menu opens/closes
  useEffect(() => {
    if (isMenuOpen) {
      // Save current focus
      const previouslyFocused = document.activeElement as HTMLElement;

      // Focus the sidebar for screen readers
      if (sidebarRef.current) {
        sidebarRef.current.focus();
      }

      // Return focus when menu closes
      return () => {
        previouslyFocused?.focus();
      };
    }
  }, [isMenuOpen]);

  // Handle escape key to close menu
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);

  return (
    <div
      ref={containerRef}
      className={`tw-h-screen ${
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

      {/* Animated overlay and sidebar */}
      {/* Overlay - fades in/out */}
      <button
        type="button"
        tabIndex={isMenuOpen ? 0 : -1}
        aria-label="Close navigation menu"
        className={`tw-fixed tw-inset-0 tw-bg-gray-500 tw-z-40 tw-transition-opacity tw-duration-300 ${
          isMenuOpen
            ? "tw-bg-opacity-50"
            : "tw-bg-opacity-0 tw-pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Sidebar - slides in/out */}
      <nav
        ref={sidebarRef}
        aria-label="Navigation menu"
        tabIndex={-1}
        aria-hidden={!isMenuOpen}
        className={`tailwind-scope tw-fixed tw-inset-y-0 tw-left-0 tw-z-50 tw-transition-transform tw-duration-300 tw-ease-in-out ${
          isMenuOpen ? "tw-translate-x-0" : "-tw-translate-x-full"
        }`}
        style={{ width: SIDEBAR_WIDTHS.EXPANDED }}
      >
        {renderSidebar()}
      </nav>

      {/* Main content area */}
      <main
        className={`tw-transition-opacity tw-duration-300 ${
          isMenuOpen ? "tw-opacity-40 tw-pointer-events-none" : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
}
