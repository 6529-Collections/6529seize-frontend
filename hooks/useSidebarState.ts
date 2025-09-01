"use client";

import { useState, useCallback, useMemo } from "react";

export interface SidebarState {
  isMainSidebarCollapsed: boolean;
  isCollectionsSubmenuOpen: boolean;
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
}

export interface UseSidebarStateReturn extends SidebarState, SidebarActions {
  canBothSidebarsBeVisible: boolean;
}

/**
 * Custom hook for managing desktop sidebar state
 * 
 * This hook manages the state of both the main sidebar and collections submenu,
 * implementing the specific behavior requirements:
 * - Collections click: collapse main sidebar and show submenu
 * - Chevron-left click: expand main sidebar while keeping submenu open
 * - Both sidebars can be visible simultaneously
 */
export function useSidebarState(): UseSidebarStateReturn {
  const [isMainSidebarCollapsed, setIsMainSidebarCollapsed] = useState(false);
  const [isCollectionsSubmenuOpen, setIsCollectionsSubmenuOpen] = useState(false);

  // Main sidebar actions
  const toggleMainSidebar = useCallback(() => {
    setIsMainSidebarCollapsed(prev => !prev);
  }, []);

  const collapseMainSidebar = useCallback(() => {
    setIsMainSidebarCollapsed(true);
  }, []);

  const expandMainSidebar = useCallback(() => {
    setIsMainSidebarCollapsed(false);
  }, []);

  // Collections submenu actions
  const toggleCollectionsSubmenu = useCallback(() => {
    setIsCollectionsSubmenuOpen(prev => !prev);
  }, []);

  const openCollectionsSubmenu = useCallback(() => {
    setIsCollectionsSubmenuOpen(true);
  }, []);

  const closeCollectionsSubmenu = useCallback(() => {
    setIsCollectionsSubmenuOpen(false);
  }, []);

  // Specific interaction handlers
  const handleCollectionsClick = useCallback(() => {
    if (!isCollectionsSubmenuOpen) {
      // Opening submenu: collapse main sidebar and show submenu
      setIsCollectionsSubmenuOpen(true);
      setIsMainSidebarCollapsed(true);
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

  return {
    // State
    isMainSidebarCollapsed,
    isCollectionsSubmenuOpen,
    canBothSidebarsBeVisible,
    
    // Basic actions
    toggleMainSidebar,
    collapseMainSidebar,
    expandMainSidebar,
    toggleCollectionsSubmenu,
    openCollectionsSubmenu,
    closeCollectionsSubmenu,
    
    // Specific interaction handlers
    handleCollectionsClick,
    handleChevronLeftClick,
  };
}

export default useSidebarState;