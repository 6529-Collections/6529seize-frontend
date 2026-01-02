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
    window?: Window | undefined;
  };
  return browserWindow;
};

/**
 * useSidebarController
 *
 * Controls the main (left) sidebar responsive behavior and visual state.
 * - Determines mobile vs desktop using a `matchMedia` query at `SIDEBAR_BREAKPOINT`.
 * - Manages desktop collapsed state (default: collapsed) with session persistence.
 * - Manages mobile off‑canvas open state (overlay panel on small screens).
 * - Exposes memoized actions and a computed `sidebarWidth` used by layouts.
 *
 * Notes
 * - Desktop sidebar defaults to collapsed on big screens (≥1024px).
 * - User preference is stored in sessionStorage (cleared when tab closes).
 * - Cleans up media query listeners on unmount.
 * - ESC key handling and focus management for the off‑canvas panel are handled
 *   by the sidebar component, not this hook.
 */
export function useSidebarController() {
  const createMediaQuery = useCallback((query: string): MediaQueryList | null => {
    const browserWindow = getBrowserWindow();
    if (browserWindow === undefined || typeof browserWindow.matchMedia !== "function") {
      return null;
    }
    return browserWindow.matchMedia(query);
  }, []);

  const narrowMql = useMemo(
    () => createMediaQuery(`(max-width: ${SIDEBAR_BREAKPOINT - 0.02}px)`),
    [createMediaQuery]
  );
  const coarseMql = useMemo(() => createMediaQuery("(pointer: coarse)"), [createMediaQuery]);
  const mobileWidthMql = useMemo(
    () => createMediaQuery(`(max-width: ${SIDEBAR_MOBILE_BREAKPOINT - 0.02}px)`),
    [createMediaQuery]
  );

  const [isNarrow, setIsNarrow] = useState(() => narrowMql?.matches ?? false);
  const [isTouchScreen, setIsTouchScreen] = useState(() => coarseMql?.matches ?? false);
  const [isMobileWidth, setIsMobileWidth] = useState(() => mobileWidthMql?.matches ?? false);

  const lastIsNarrowRef = useRef(isNarrow);

  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(() => {
    try {
      const stored = safeSessionStorage.getItem("sidebarCollapsed");
      if (stored === null) {
        return true;
      }
      const parsed = JSON.parse(stored);
      return typeof parsed === "boolean" ? parsed : true;
    } catch {
      return true;
    }
  });

  const persistDesktopCollapsed = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setIsDesktopCollapsed((prev: boolean) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      try {
        safeSessionStorage.setItem("sidebarCollapsed", JSON.stringify(newValue));
      } catch (e) {
        console.warn("Failed to save sidebar preference:", e);
      }
      return newValue;
    });
  }, []);

  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);

  const isMobile = useMemo(
    () => isMobileWidth && isTouchScreen,
    [isMobileWidth, isTouchScreen]
  );

  const isOffcanvasMode = useMemo(
    () => isMobile || isNarrow,
    [isMobile, isNarrow]
  );

  const isCollapsed = useMemo(() => {
    if (isOffcanvasMode) {
      if (isOffcanvasOpen) {
        return false;
      }
      return true;
    }
    return isDesktopCollapsed;
  }, [isOffcanvasMode, isOffcanvasOpen, isDesktopCollapsed]);

  useEffect(() => {
    if (!narrowMql) {
      return;
    }
    const handleChange = (event: MediaQueryListEvent) => setIsNarrow(event.matches);
    setIsNarrow(narrowMql.matches);
    narrowMql.addEventListener("change", handleChange);
    return () => narrowMql.removeEventListener("change", handleChange);
  }, [narrowMql]);

  useEffect(() => {
    if (!coarseMql) {
      return;
    }
    const handleChange = (event: MediaQueryListEvent) => setIsTouchScreen(event.matches);
    setIsTouchScreen(coarseMql.matches);
    coarseMql.addEventListener("change", handleChange);
    return () => coarseMql.removeEventListener("change", handleChange);
  }, [coarseMql]);

  useEffect(() => {
    if (!mobileWidthMql) {
      return;
    }
    const handleChange = (event: MediaQueryListEvent) => setIsMobileWidth(event.matches);
    setIsMobileWidth(mobileWidthMql.matches);
    mobileWidthMql.addEventListener("change", handleChange);
    return () => mobileWidthMql.removeEventListener("change", handleChange);
  }, [mobileWidthMql]);

  useEffect(() => {
    if (isMobile) {
      setIsOffcanvasOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (lastIsNarrowRef.current === isNarrow) {
      return;
    }

    if (isNarrow) {
      setIsOffcanvasOpen(false);
    } else if (isOffcanvasOpen) {
      setIsDesktopCollapsed(false);
      setIsOffcanvasOpen(false);
    }

    lastIsNarrowRef.current = isNarrow;
  }, [isNarrow, isOffcanvasOpen, setIsDesktopCollapsed, setIsOffcanvasOpen]);

  const toggleCollapsed = useCallback(() => {
    if (isOffcanvasMode) {
      setIsOffcanvasOpen(prev => !prev);
    } else {
      persistDesktopCollapsed(prev => !prev);
    }
  }, [isOffcanvasMode, persistDesktopCollapsed]);

  const closeOffcanvas = useCallback(() => {
    setIsOffcanvasOpen(false);
  }, []);

  const sidebarWidth = useMemo(() => {
    if (isOffcanvasMode && isOffcanvasOpen) {
      return SIDEBAR_WIDTHS.EXPANDED;
    }
    return isCollapsed ? SIDEBAR_WIDTHS.COLLAPSED : SIDEBAR_WIDTHS.EXPANDED;
  }, [isOffcanvasMode, isOffcanvasOpen, isCollapsed]);

  return {
    isMobile,
    isNarrow,
    isCollapsed,
    isOffcanvasMode,
    isOffcanvasOpen,
    toggleCollapsed,
    closeOffcanvas,
    sidebarWidth,
  };
}
