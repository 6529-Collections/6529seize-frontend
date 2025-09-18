"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { SIDEBAR_WIDTHS, SIDEBAR_BREAKPOINT } from "../constants/sidebar";
import { safeSessionStorage } from "../helpers/safeSessionStorage";

/**
 * useSidebarController
 *
 * Controls the main (left) sidebar responsive behavior and visual state.
 * - Determines mobile vs desktop using a `matchMedia` query at `SIDEBAR_BREAKPOINT`.
 * - Manages desktop collapsed state (default: expanded) with session persistence.
 * - Manages mobile off‑canvas open state (overlay panel on small screens).
 * - Exposes memoized actions and a computed `sidebarWidth` used by layouts.
 *
 * Notes
 * - Desktop sidebar defaults to expanded on big screens (≥1024px).
 * - User preference is stored in sessionStorage (cleared when tab closes).
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

  // Desktop state - default to expanded (false) on big screens with session persistence
  const [isDesktopCollapsed, setIsDesktopCollapsedState] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = safeSessionStorage.getItem("sidebarCollapsed");
      return stored !== null ? JSON.parse(stored) : false;
    } catch {
      return false; // Default to expanded on error
    }
  });

  // Wrapper to persist state changes to sessionStorage
  const setIsDesktopCollapsed = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setIsDesktopCollapsedState((prev: boolean) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      // Save to sessionStorage
      try {
        safeSessionStorage.setItem("sidebarCollapsed", JSON.stringify(newValue));
      } catch (e) {
        console.warn("Failed to save sidebar preference:", e);
      }
      return newValue;
    });
  }, []);

  // Off-canvas overlay state (mobile expanded view)
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);

  // Derived collapsed state (pure function of inputs)
  const isCollapsed = useMemo(() => {
    if (isMobile) return true; // Mobile always collapsed when not off-canvas
    return isDesktopCollapsed; // Desktop: use current state (default false = expanded)
  }, [isMobile, isDesktopCollapsed]);

  // React to breakpoint changes
  useEffect(() => {
    if (!mql) return;
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [mql]);

  // Close off-canvas when switching from desktop to mobile
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
      // Desktop: toggle state (with session persistence)
      setIsDesktopCollapsed(prev => !prev);
    }
  }, [isMobile, setIsDesktopCollapsed]);

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
