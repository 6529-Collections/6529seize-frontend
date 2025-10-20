"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

type SidebarState = {
  isRightSidebarOpen: boolean;
  toggleRightSidebar: () => void;
  openRightSidebar: () => void;
  closeRightSidebar: () => void;
};

const SidebarContext = createContext<SidebarState | undefined>(undefined);

export function SidebarProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const toggleRightSidebar = useCallback(() => {
    setIsRightSidebarOpen((prev: boolean) => !prev);
  }, []);

  const openRightSidebar = useCallback(() => setIsRightSidebarOpen(true), []);
  const closeRightSidebar = useCallback(() => setIsRightSidebarOpen(false), []);

  const value = useMemo(
    () => ({
      isRightSidebarOpen,
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

export function useSidebarState(): SidebarState {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebarState must be used within a SidebarProvider");
  }
  return context;
}
