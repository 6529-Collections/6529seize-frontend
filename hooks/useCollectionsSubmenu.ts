"use client";

import { useEffect, useRef, useState } from "react";
import { COLLECTIONS_ROUTES } from "../constants/sidebar";

export function useCollectionsSubmenu(pathname: string | null, isMobile: boolean) {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const seenRoutes = useRef<Set<string>>(new Set());

  // Check if current path is a collections page
  const isOnCollectionsPage = COLLECTIONS_ROUTES.some(route => 
    pathname?.startsWith(route)
  );

  // Auto-open logic: only on desktop, only first time per route
  useEffect(() => {
    if (!isMobile && isOnCollectionsPage && pathname) {
      if (!seenRoutes.current.has(pathname)) {
        setIsSubmenuOpen(true);
        seenRoutes.current.add(pathname);
      }
    }
    
    // Close when leaving collections pages
    if (!isOnCollectionsPage) {
      setIsSubmenuOpen(false);
    }
  }, [pathname, isOnCollectionsPage, isMobile]);

  const toggleSubmenu = () => setIsSubmenuOpen(prev => !prev);

  return {
    isSubmenuOpen,
    setIsSubmenuOpen,
    toggleSubmenu,
    isOnCollectionsPage,
  };
}