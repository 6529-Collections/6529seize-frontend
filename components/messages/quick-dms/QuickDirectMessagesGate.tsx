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

const DESKTOP_VIEWPORT_QUERY = `(min-width: ${SIDEBAR_MOBILE_BREAKPOINT}px)`;

type BrowserWindowWithOptionalMatchMedia = {
  matchMedia?: Window["matchMedia"];
};

const getBrowserWindow = (): BrowserWindowWithOptionalMatchMedia | undefined =>
  (globalThis as { window?: BrowserWindowWithOptionalMatchMedia }).window;

const getDesktopViewportSnapshot = (): boolean => {
  return (
    getBrowserWindow()?.matchMedia?.(DESKTOP_VIEWPORT_QUERY).matches ?? false
  );
};

const subscribeDesktopViewport = (onStoreChange: () => void): (() => void) => {
  const mediaQuery = getBrowserWindow()?.matchMedia?.(DESKTOP_VIEWPORT_QUERY);

  if (mediaQuery === undefined) {
    return () => undefined;
  }

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
