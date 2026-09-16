"use client";

import { useVersionStatus } from "@/contexts/VersionStatusContext";
import useDeviceInfo from "@/hooks/useDeviceInfo";

export function useWebVersionUpdate(): "sidebar" | "toast" | null {
  const isVersionStale = useVersionStatus();
  const { isApp, isMobileDevice, isAppleMobile, hasTouchScreen } =
    useDeviceInfo();

  if (!isVersionStale || isApp) return null;

  // Phones and tablets retain the toast, including with desktop-mode browsing
  // or an attached pointer. Narrow desktop windows retain their sidebar item.
  return isMobileDevice || isAppleMobile || hasTouchScreen
    ? "toast"
    : "sidebar";
}
