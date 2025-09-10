"use client";

import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useMemo, 
  useEffect, 
  ReactNode 
} from "react";

export interface SidebarState {
  isMainSidebarCollapsed: boolean;
  isCollectionsSubmenuOpen: boolean;
  isRightSidebarOpen: boolean;
}

export interface SidebarActions {
  toggleMainSidebar: () => void;
  collapseMainSidebar: () => void;
  expandMainSidebar: () => void;
  toggleCollectionsSubmenu: () => void;
  openCollectionsSubmenu: () => void;
  closeCollectionsSubmenu: () => void;
  handleCollectionsClick: () => void;
  handleChevronLeftClick: () => void;
  toggleRightSidebar: () => void;
  openRightSidebar: () => void;
  closeRightSidebar: () => void;
}

export interface UseSidebarStateReturn extends SidebarState, SidebarActions {
  canBothSidebarsBeVisible: boolean;
}

// Create the context
const SidebarContext = createContext<UseSidebarStateReturn | null>(null);

// Provider component
export function SidebarProvider({ children }: { children: ReactNode }) {
  // Default to collapsed (true) with no persistence
  const [isMainSidebarCollapsed, setIsMainSidebarCollapsed] = useState(true);
  const [isCollectionsSubmenuOpen, setIsCollectionsSubmenuOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  // Main sidebar actions (no mutual exclusion)
  const toggleMainSidebar = useCallback(() => {
    setIsMainSidebarCollapsed((prev: boolean) => !prev);
  }, []);

  const collapseMainSidebar = useCallback(() => {
    setIsMainSidebarCollapsed(true);
  }, []);

  const expandMainSidebar = useCallback(() => {
    setIsMainSidebarCollapsed(false);
  }, []);

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

  // Right sidebar actions (no mutual exclusion)
  const toggleRightSidebar = useCallback(() => {
    setIsRightSidebarOpen((prev: boolean) => !prev);
  }, []);

  const openRightSidebar = useCallback(() => {
    setIsRightSidebarOpen(true);
  }, []);

  const closeRightSidebar = useCallback(() => {
    setIsRightSidebarOpen(false);
  }, []);

  // Specific interaction handlers
  const handleCollectionsClick = useCallback(() => {
    if (!isCollectionsSubmenuOpen) {
      // Opening submenu: collapse main sidebar, close right sidebar, and show submenu
      setIsCollectionsSubmenuOpen(true);
      setIsMainSidebarCollapsed(true);
      setIsRightSidebarOpen(false);
    } else {
      // Closing submenu: just close it, don't change main sidebar
      setIsCollectionsSubmenuOpen(false);
    }
  }, [isCollectionsSubmenuOpen]);

  const handleChevronLeftClick = useCallback(() => {
    // Expand main sidebar while keeping submenu open
    setIsMainSidebarCollapsed(false);
    // Don't close the submenu - this is the key behavior requirement
  }, []);

  // Computed values
  const canBothSidebarsBeVisible = useMemo(() => {
    return !isMainSidebarCollapsed && isCollectionsSubmenuOpen;
  }, [isMainSidebarCollapsed, isCollectionsSubmenuOpen]);

  const value = useMemo(() => ({
    // State
    isMainSidebarCollapsed,
    isCollectionsSubmenuOpen,
    isRightSidebarOpen,
    canBothSidebarsBeVisible,
    
    // Basic actions
    toggleMainSidebar,
    collapseMainSidebar,
    expandMainSidebar,
    toggleCollectionsSubmenu,
    openCollectionsSubmenu,
    closeCollectionsSubmenu,
    toggleRightSidebar,
    openRightSidebar,
    closeRightSidebar,
    
    // Specific interaction handlers
    handleCollectionsClick,
    handleChevronLeftClick,
  }), [
    isMainSidebarCollapsed,
    isCollectionsSubmenuOpen,
    isRightSidebarOpen,
    canBothSidebarsBeVisible,
    toggleMainSidebar,
    collapseMainSidebar,
    expandMainSidebar,
    toggleCollectionsSubmenu,
    openCollectionsSubmenu,
    closeCollectionsSubmenu,
    toggleRightSidebar,
    openRightSidebar,
    closeRightSidebar,
    handleCollectionsClick,
    handleChevronLeftClick,
  ]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

// Hook to use the sidebar context
export function useSidebarState(): UseSidebarStateReturn {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarState must be used within a SidebarProvider');
  }
  return context;
}

export default useSidebarState;