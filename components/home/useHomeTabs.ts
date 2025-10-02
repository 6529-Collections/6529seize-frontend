"use client";

import { useCallback, useEffect, useState } from "react";

type HomeTab = "feed" | "latest";

const HOME_TAB_STORAGE_KEY = "home.activeTab";
export const HOME_TAB_EVENT = "homeTabChange";

const getBrowserWindow = () => {
  const { window: browserWindow } = globalThis as typeof globalThis & {
    window?: Window;
  };
  return browserWindow;
};

export const getStoredHomeTab = (): HomeTab => {
  const browserWindow = getBrowserWindow();
  if (browserWindow === undefined) {
    return "latest";
  }

  try {
    const saved = browserWindow.localStorage.getItem(HOME_TAB_STORAGE_KEY);
    return saved === "feed" || saved === "latest" ? saved : "latest";
  } catch (error) {
    console.warn("Failed to read home tab from storage", error);
    return "latest";
  }
};

export const setStoredHomeTab = (tab: HomeTab) => {
  const browserWindow = getBrowserWindow();
  if (browserWindow === undefined) {
    return;
  }

  try {
    const current = browserWindow.localStorage.getItem(HOME_TAB_STORAGE_KEY);
    if (current === tab) {
      browserWindow.dispatchEvent(
        new CustomEvent(HOME_TAB_EVENT, {
          detail: { tab },
        })
      );
      return;
    }

    browserWindow.localStorage.setItem(HOME_TAB_STORAGE_KEY, tab);
    browserWindow.dispatchEvent(
      new CustomEvent(HOME_TAB_EVENT, {
        detail: { tab },
      })
    );
  } catch (error) {
    console.warn("Failed to persist home tab to storage", error);
  }
};

export function useHomeTabs() {
  const [activeTab, setActiveTab] = useState<HomeTab>(() => getStoredHomeTab());

  useEffect(() => {
    const browserWindow = getBrowserWindow();
    if (browserWindow === undefined) {
      return;
    }

    const params = new URLSearchParams(browserWindow.location.search);
    if (!params.has("tab")) return;

    params.delete("tab");
    const search = params.toString();
    const queryPrefix = search ? `?${search}` : "";
    const hash = browserWindow.location.hash ?? "";
    const nextUrl = `${browserWindow.location.pathname}${queryPrefix}${hash}`;
    browserWindow.history.replaceState(null, "", nextUrl);
  }, []);

  useEffect(() => {
    const browserWindow = getBrowserWindow();
    if (browserWindow === undefined) {
      return;
    }

    const handleTabEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ tab?: HomeTab }>).detail;
      if (!detail?.tab) return;
      if (detail.tab !== "feed" && detail.tab !== "latest") return;
      setActiveTab(detail.tab);
    };

    browserWindow.addEventListener(HOME_TAB_EVENT, handleTabEvent as EventListener);

    return () => {
      browserWindow.removeEventListener(
        HOME_TAB_EVENT,
        handleTabEvent as EventListener
      );
    };
  }, []);

  const handleTabChange = useCallback((tab: HomeTab) => {
    setActiveTab(tab);
    setStoredHomeTab(tab);
  }, []);

  return { activeTab, handleTabChange } as const;
}

export type { HomeTab };
