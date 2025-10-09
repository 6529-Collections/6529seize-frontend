"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  SIDEBAR_WIDTHS,
  SIDEBAR_BREAKPOINT,
  SIDEBAR_MOBILE_BREAKPOINT,
} from "../constants/sidebar";
import { safeSessionStorage } from "../helpers/safeSessionStorage";

const getBrowserWindow = () => {
  const { window: browserWindow } = globalThis as typeof globalThis & {
    window?: Window;
  };
  return browserWindow;
};

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
  // Media query for breakpoint (narrow screen)
  const mql = useMemo(() => {
    const browserWindow = getBrowserWindow();
    if (browserWindow === undefined || typeof browserWindow.matchMedia !== "function") {
      return null;
    }
    return browserWindow.matchMedia(`(max-width: ${SIDEBAR_BREAKPOINT - 0.02}px)`);
  }, []);

  const [isNarrow, setIsNarrow] = useState(() => {
    const browserWindow = getBrowserWindow();
    return browserWindow ? browserWindow.innerWidth < SIDEBAR_BREAKPOINT : false;
  });

  // Detect coarse pointer devices (touch screens)
  const coarseMql = useMemo(() => {
    const browserWindow = getBrowserWindow();
    if (browserWindow === undefined || typeof browserWindow.matchMedia !== "function") {
      return null;
    }
    return browserWindow.matchMedia("(pointer: coarse)");
  }, []);
  const [isTouchScreen, setIsTouchScreen] = useState(() => {
    const browserWindow = getBrowserWindow();
    return browserWindow ? browserWindow.matchMedia?.("(pointer: coarse)").matches ?? false : false;
  });

  // Detect mobile-width (< 1024px)
  const mobileWidthMql = useMemo(() => {
    const browserWindow = getBrowserWindow();
    if (browserWindow === undefined || typeof browserWindow.matchMedia !== "function") {
      return null;
    }
    return browserWindow.matchMedia(`(max-width: ${SIDEBAR_MOBILE_BREAKPOINT - 0.02}px)`);
  }, []);
  const [isMobileWidth, setIsMobileWidth] = useState(() => {
    const browserWindow = getBrowserWindow();
    return browserWindow ? browserWindow.innerWidth < SIDEBAR_MOBILE_BREAKPOINT : false;
  });

  // Desktop state - default to expanded (false) on big screens with session persistence
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(() => {
    try {
      const stored = safeSessionStorage.getItem("sidebarCollapsed");
      return stored !== null ? JSON.parse(stored) : false;
    } catch {
      return false; // Default to expanded on error
    }
  });

  // Wrapper to persist state changes to sessionStorage
  const persistDesktopCollapsed = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setIsDesktopCollapsed((prev: boolean) => {
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

  // Determine mobile mode only for mobile width + touch devices (phones/tablets)
  const isMobile = useMemo(
    () => isMobileWidth && isTouchScreen,
    [isMobileWidth, isTouchScreen]
  );

  const isOffcanvasMode = useMemo(
    () => isMobile || isNarrow,
    [isMobile, isNarrow]
  );

  // Derived collapsed state (pure function of inputs)
  const isCollapsed = useMemo(() => {
    if (isOffcanvasMode) {
      // Overlay open => expanded; closed => collapsed
      return !isOffcanvasOpen;
    }
    // Wide desktop: honor user preference
    return isDesktopCollapsed;
  }, [isOffcanvasMode, isOffcanvasOpen, isDesktopCollapsed]);

  // React to breakpoint changes
  useEffect(() => {
    if (mql === null) {
      return;
    }
    const onChange = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
    setIsNarrow(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [mql]);

  // React to touch capability changes
  useEffect(() => {
    if (coarseMql === null) {
      return;
    }
    const onChange = (e: MediaQueryListEvent) => setIsTouchScreen(e.matches);
    setIsTouchScreen(coarseMql.matches);
    coarseMql.addEventListener("change", onChange);
    return () => coarseMql.removeEventListener("change", onChange);
  }, [coarseMql]);

  // React to width changes for mobile detection
  useEffect(() => {
    if (mobileWidthMql === null) {
      return;
    }
    const onChange = (e: MediaQueryListEvent) => setIsMobileWidth(e.matches);
    setIsMobileWidth(mobileWidthMql.matches);
    mobileWidthMql.addEventListener("change", onChange);
    return () => mobileWidthMql.removeEventListener("change", onChange);
  }, [mobileWidthMql]);

  // Close off-canvas when switching from desktop to mobile
  useEffect(() => {
    if (isMobile) {
      setIsOffcanvasOpen(false);
    }
  }, [isMobile]);

  // Keep behavior consistent across narrow desktop transitions
  // - Entering narrow: do not auto-open; ensure overlay is closed
  // - Leaving narrow: map current overlay state to desktop preference (expanded if was open)
  const prevIsNarrowRef = useRef(isNarrow);
  useEffect(() => {
    if (prevIsNarrowRef.current === isNarrow) return;

    if (isNarrow) {
      // Entering narrow: never auto-open
      setIsOffcanvasOpen(false);
    } else if (isOffcanvasOpen) {
      // Leaving narrow: if overlay was open, expand persistent rail on desktop
      setIsDesktopCollapsed(false);
      setIsOffcanvasOpen(false);
    }

    prevIsNarrowRef.current = isNarrow;
  }, [isNarrow, isOffcanvasOpen]);

  const toggleCollapsed = useCallback(() => {
    if (isOffcanvasMode) {
      // Mobile: toggle off-canvas overlay
      setIsOffcanvasOpen(prev => !prev);
    } else {
      // Desktop: toggle state (with session persistence)
      persistDesktopCollapsed(prev => !prev);
    }
  }, [isOffcanvasMode, persistDesktopCollapsed]);

  const closeOffcanvas = useCallback(() => {
    setIsOffcanvasOpen(false);
  }, []);

  // Calculate CSS values based on derived state  
  const sidebarWidth = useMemo(() => {
    if (isOffcanvasMode && isOffcanvasOpen) {
      return SIDEBAR_WIDTHS.EXPANDED;
    }
    return isCollapsed ? SIDEBAR_WIDTHS.COLLAPSED : SIDEBAR_WIDTHS.EXPANDED;
  }, [isOffcanvasMode, isOffcanvasOpen, isCollapsed]);

  return {
    // State
    isMobile,
    isNarrow,
    isCollapsed,
    isOffcanvasMode,
    isOffcanvasOpen,
    
    // Actions (memoized to prevent unnecessary re-renders)
    toggleCollapsed,
    closeOffcanvas,
    
    // Computed values for layout
    sidebarWidth,
  };
}
