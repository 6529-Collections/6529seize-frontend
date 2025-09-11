"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

/**
 * useSidebarState context
 *
 * Global UI state not covered by the responsive left sidebar controller.
 * - Right sidebar visibility (open/close)
 * - Collections submenu visibility (open/close)
 *
 * Note: Main (left) sidebar responsive/collapsed/off‑canvas state lives in
 * `useSidebarController` and should not be duplicated here.
 */
export interface SidebarState {
  isCollectionsSubmenuOpen: boolean;
  isRightSidebarOpen: boolean;
}

export interface SidebarActions {
  toggleCollectionsSubmenu: () => void;
  openCollectionsSubmenu: () => void;
  closeCollectionsSubmenu: () => void;
  toggleRightSidebar: () => void;
  openRightSidebar: () => void;
  closeRightSidebar: () => void;
}

export type UseSidebarStateReturn = SidebarState & SidebarActions;

// Create the context
const SidebarContext = createContext<UseSidebarStateReturn | null>(null);

// Provider component
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollectionsSubmenuOpen, setIsCollectionsSubmenuOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  // Collections submenu actions
  const toggleCollectionsSubmenu = useCallback(() => {
    setIsCollectionsSubmenuOpen((prev: boolean) => !prev);
  }, []);

  const openCollectionsSubmenu = useCallback(() => {
    setIsCollectionsSubmenuOpen(true);
  }, []);

  const closeCollectionsSubmenu = useCallback(() => {
    setIsCollectionsSubmenuOpen(false);
  }, []);

  // Right sidebar actions
  const toggleRightSidebar = useCallback(() => {
    setIsRightSidebarOpen((prev: boolean) => !prev);
  }, []);

  const openRightSidebar = useCallback(() => {
    setIsRightSidebarOpen(true);
  }, []);

  const closeRightSidebar = useCallback(() => {
    setIsRightSidebarOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      // State
      isCollectionsSubmenuOpen,
      isRightSidebarOpen,

      // Actions
      toggleCollectionsSubmenu,
      openCollectionsSubmenu,
      closeCollectionsSubmenu,
      toggleRightSidebar,
      openRightSidebar,
      closeRightSidebar,
    }),
    [
      isCollectionsSubmenuOpen,
      isRightSidebarOpen,
      toggleCollectionsSubmenu,
      openCollectionsSubmenu,
      closeCollectionsSubmenu,
      toggleRightSidebar,
      openRightSidebar,
      closeRightSidebar,
    ]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

// Hook to use the sidebar context
export function useSidebarState(): UseSidebarStateReturn {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarState must be used within a SidebarProvider");
  }
  return context;
}

export default useSidebarState;
