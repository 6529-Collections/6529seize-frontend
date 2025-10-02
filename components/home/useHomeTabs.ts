"use client";

import { useCallback, useEffect, useState } from "react";

type HomeTab = "feed" | "latest";

const HOME_TAB_STORAGE_KEY = "home.activeTab";
export const HOME_TAB_EVENT = "homeTabChange";

export const getStoredHomeTab = (): HomeTab => {
  if (typeof window === "undefined") {
    return "latest";
  }

  try {
    const saved = window.localStorage.getItem(HOME_TAB_STORAGE_KEY);
    return saved === "feed" || saved === "latest" ? saved : "latest";
  } catch (error) {
    console.warn("Failed to read home tab from storage", error);
    return "latest";
  }
};

export const setStoredHomeTab = (tab: HomeTab) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const current = window.localStorage.getItem(HOME_TAB_STORAGE_KEY);
    if (current === tab) {
      window.dispatchEvent(
        new CustomEvent(HOME_TAB_EVENT, {
          detail: { tab },
        })
      );
      return;
    }

    window.localStorage.setItem(HOME_TAB_STORAGE_KEY, tab);
    window.dispatchEvent(
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
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("tab")) return;

    params.delete("tab");
    const search = params.toString();
    const hash = window.location.hash ?? "";
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleTabEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ tab?: HomeTab }>).detail;
      if (!detail?.tab) return;
      if (detail.tab !== "feed" && detail.tab !== "latest") return;
      setActiveTab(detail.tab);
    };

    window.addEventListener(HOME_TAB_EVENT, handleTabEvent as EventListener);

    return () => {
      window.removeEventListener(
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
