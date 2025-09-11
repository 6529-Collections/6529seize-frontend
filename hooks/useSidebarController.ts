"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { SIDEBAR_WIDTHS, SIDEBAR_BREAKPOINT } from "../constants/sidebar";

/**
 * useSidebarController
 *
 * Controls the main (left) sidebar responsive behavior and visual state.
 * - Determines mobile vs desktop using a `matchMedia` query at `SIDEBAR_BREAKPOINT`.
 * - Manages desktop collapsed state (default: collapsed) without persistence.
 * - Manages mobile off‑canvas open state (overlay panel on small screens).
 * - Exposes memoized actions and a computed `sidebarWidth` used by layouts.
 *
 * Notes
 * - Cleans up media query listeners on unmount.
 * - ESC key handling and focus management for the off‑canvas panel are handled
 *   by the sidebar component, not this hook.
 */
export function useSidebarController() {
  // Media query for desktop vs mobile breakpoint
  const mql = useMemo(() => {
    if (typeof window === "undefined") return null;
    return window.matchMedia(`(max-width: ${SIDEBAR_BREAKPOINT - 0.02}px)`);
  }, []);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < SIDEBAR_BREAKPOINT : false
  );

  // Desktop state - default to collapsed (true) with no persistence
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(true);

  // Off-canvas overlay state (mobile expanded view)
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);

  // Derived collapsed state (pure function of inputs)
  const isCollapsed = useMemo(() => {
    if (isMobile) return true; // Mobile always collapsed when not off-canvas
    return isDesktopCollapsed; // Desktop: use current state (default true = collapsed)
  }, [isMobile, isDesktopCollapsed]);

  // React to breakpoint changes
  useEffect(() => {
    if (!mql) return;
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [mql]);

  // Close off-canvas when switching to mobile
  useEffect(() => {
    if (isMobile) {
      setIsOffcanvasOpen(false);
    }
  }, [isMobile]);

  const toggleCollapsed = useCallback(() => {
    if (isMobile) {
      // Mobile: toggle off-canvas overlay
      setIsOffcanvasOpen(prev => !prev);
    } else {
      // Desktop: toggle state (no persistence)
      setIsDesktopCollapsed(prev => !prev);
    }
  }, [isMobile]);

  const closeOffcanvas = useCallback(() => {
    setIsOffcanvasOpen(false);
  }, []);

  // Calculate CSS values based on derived state  
  const sidebarWidth = useMemo(() => {
    // When off-canvas is open, use expanded width; otherwise use derived collapsed state
    if (isMobile && isOffcanvasOpen) return SIDEBAR_WIDTHS.EXPANDED;
    return isCollapsed ? SIDEBAR_WIDTHS.COLLAPSED : SIDEBAR_WIDTHS.EXPANDED;
  }, [isMobile, isOffcanvasOpen, isCollapsed]);

  return {
    // State
    isMobile,
    isCollapsed,
    isOffcanvasOpen,
    
    // Actions (memoized to prevent unnecessary re-renders)
    toggleCollapsed,
    closeOffcanvas,
    
    // Computed values for layout
    sidebarWidth,
  };
}
