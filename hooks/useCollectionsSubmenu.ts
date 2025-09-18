"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { COLLECTIONS_ROUTES } from "../constants/sidebar";
import { safeSessionStorage } from "../helpers/safeSessionStorage";

export function useCollectionsSubmenu(pathname: string | null, isMobile: boolean) {
  const getInitialDismissed = () => {
    try {
      return safeSessionStorage.getItem("collectionsSubmenuDismissed") === "true";
    } catch {
      return false;
    }
  };

  const dismissedManuallyRef = useRef(getInitialDismissed());
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(() => !dismissedManuallyRef.current);

  // Check if current path is a collections page
  const isOnCollectionsPage = COLLECTIONS_ROUTES.some(route => 
    pathname?.startsWith(route)
  );

  const updateDismissed = useCallback((dismissed: boolean) => {
    dismissedManuallyRef.current = dismissed;
    try {
      safeSessionStorage.setItem("collectionsSubmenuDismissed", dismissed ? "true" : "false");
    } catch {
      // ignore storage errors (e.g., private mode)
    }
  }, []);

  // Auto-open logic: only on desktop and only when user hasn't dismissed manually
  useEffect(() => {
    if (!isOnCollectionsPage) {
      if (isSubmenuOpen) {
        setIsSubmenuOpen(false);
      }
      return;
    }

    if (isMobile) {
      return;
    }

    if (!dismissedManuallyRef.current && !isSubmenuOpen) {
      setIsSubmenuOpen(true);
    }
  }, [isOnCollectionsPage, isMobile, isSubmenuOpen]);

  const openSubmenu = useCallback(() => {
    updateDismissed(false);
    setIsSubmenuOpen(true);
  }, [updateDismissed]);

  const closeSubmenu = useCallback(() => {
    updateDismissed(true);
    setIsSubmenuOpen(false);
  }, [updateDismissed]);

  const toggleSubmenu = useCallback(() => {
    setIsSubmenuOpen(prev => {
      const next = !prev;
      updateDismissed(!next);
      return next;
    });
  }, [updateDismissed]);

  return {
    isSubmenuOpen,
    toggleSubmenu,
    openSubmenu,
    closeSubmenu,
    isOnCollectionsPage,
  };
}
