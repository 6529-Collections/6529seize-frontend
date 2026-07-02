"use client";

import { SIDEBAR_MOBILE_BREAKPOINT } from "@/constants/sidebar";
import { useAuth } from "@/components/auth/Auth";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

const LazyQuickDirectMessages = dynamic(() => import("./QuickDirectMessages"), {
  loading: () => null,
  ssr: false,
});

const getDesktopViewportSnapshot = (): boolean => {
  if (
    typeof globalThis.window === "undefined" ||
    typeof globalThis.window.matchMedia !== "function"
  ) {
    return false;
  }

  return globalThis.window.matchMedia(
    `(min-width: ${SIDEBAR_MOBILE_BREAKPOINT}px)`
  ).matches;
};

const subscribeDesktopViewport = (onStoreChange: () => void): (() => void) => {
  if (
    typeof globalThis.window === "undefined" ||
    typeof globalThis.window.matchMedia !== "function"
  ) {
    return () => undefined;
  }

  const mediaQuery = globalThis.window.matchMedia(
    `(min-width: ${SIDEBAR_MOBILE_BREAKPOINT}px)`
  );

  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
};

const useCanMountQuickDirectMessages = (): boolean => {
  const { connectedProfile, showWaves } = useAuth();
  const { isApp, isMobileDevice } = useDeviceInfo();
  const isDesktopViewport = useSyncExternalStore(
    subscribeDesktopViewport,
    getDesktopViewportSnapshot,
    () => false
  );

  return Boolean(
    !isApp &&
    !isMobileDevice &&
    isDesktopViewport &&
    connectedProfile?.handle &&
    showWaves
  );
};

export default function QuickDirectMessagesGate() {
  const canMountQuickDirectMessages = useCanMountQuickDirectMessages();

  if (!canMountQuickDirectMessages) {
    return null;
  }

  return <LazyQuickDirectMessages />;
}
