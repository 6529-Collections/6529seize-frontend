"use client";

type HomeTab = "feed" | "latest";

const HOME_TAB_STORAGE_KEY = "home.activeTab";
export const HOME_TAB_EVENT = "homeTabChange";

const getBrowserWindow = () => {
  const { window: browserWindow } = globalThis as typeof globalThis & {
    window?: Window | undefined;
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

export type { HomeTab };
