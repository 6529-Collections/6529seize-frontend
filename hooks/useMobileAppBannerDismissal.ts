"use client";

import { useSyncExternalStore } from "react";

const MOBILE_APP_DISMISSAL_KEY = "6529-mobile-banner-dismissed-until";
const MOBILE_APP_DISMISSAL_MS = 7 * 24 * 60 * 60 * 1000;
const DISMISSAL_EVENT = "6529-mobile-banner-dismissal";
let memoryDismissedUntil = 0;

function getDismissedUntil(): number {
  if (memoryDismissedUntil > Date.now()) return memoryDismissedUntil;
  try {
    const value = Number(localStorage.getItem(MOBILE_APP_DISMISSAL_KEY));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return memoryDismissedUntil;
  }
}

function getSnapshot(): boolean {
  return getDismissedUntil() > Date.now();
}

const getServerSnapshot = () => true;

function subscribe(onChange: () => void): () => void {
  let timeout: ReturnType<typeof setTimeout>;
  const update = () => {
    clearTimeout(timeout);
    const remaining = getDismissedUntil() - Date.now();
    if (remaining > 0) {
      timeout = setTimeout(
        update,
        Math.min(remaining, MOBILE_APP_DISMISSAL_MS)
      );
    }
    onChange();
  };
  update();
  window.addEventListener("storage", update);
  window.addEventListener("focus", update);
  window.addEventListener(DISMISSAL_EVENT, update);
  return () => {
    clearTimeout(timeout);
    window.removeEventListener("storage", update);
    window.removeEventListener("focus", update);
    window.removeEventListener(DISMISSAL_EVENT, update);
  };
}

export function dismissMobileAppBanner(): void {
  const dismissedUntil = Date.now() + MOBILE_APP_DISMISSAL_MS;
  try {
    localStorage.setItem(MOBILE_APP_DISMISSAL_KEY, String(dismissedUntil));
  } catch {
    memoryDismissedUntil = dismissedUntil;
    // In-memory dismissal still survives client-side navigation when storage is blocked.
  }
  window.dispatchEvent(new Event(DISMISSAL_EVENT));
}

export function useMobileAppBannerDismissal(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
