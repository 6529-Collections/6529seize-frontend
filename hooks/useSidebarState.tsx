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
 *
 * Note: Main (left) sidebar responsive/collapsed/off‑canvas state lives in
 * `useSidebarController` and should not be duplicated here.
 */
export interface SidebarState {
  isRightSidebarOpen: boolean;
}

export interface SidebarActions {
  toggleRightSidebar: () => void;
  openRightSidebar: () => void;
  closeRightSidebar: () => void;
}

export type UseSidebarStateReturn = SidebarState & SidebarActions;

// Create the context
const SidebarContext = createContext<UseSidebarStateReturn | null>(null);

// Provider component
export function SidebarProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

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
      isRightSidebarOpen,

      // Actions
      toggleRightSidebar,
      openRightSidebar,
      closeRightSidebar,
    }),
    [
      isRightSidebarOpen,
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
