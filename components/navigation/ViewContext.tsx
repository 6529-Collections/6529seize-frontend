"use client";

import type { ReactNode } from "react";
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { ViewKey, NavItem } from "./navTypes";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useSearchParams, useRouter } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import {
  getHomeFeedRoute,
  getHomeLatestRoute,
  getMessagesBaseRoute,
  getWaveRoute,
  getWavesBaseRoute,
} from "@/helpers/navigation.helpers";
import type { HomeTab } from "@/components/home/useHomeTabs";
import {
  HOME_TAB_EVENT,
  getStoredHomeTab,
  setStoredHomeTab,
} from "@/components/home/useHomeTabs";

interface ViewContextType {
  activeView: ViewKey | null;
  hardBack: (v: ViewKey) => void;
  handleNavClick: (item: NavItem) => void;
  homeActiveTab: HomeTab;
  clearLastVisited: (type: "wave" | "dm") => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ readonly children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isApp } = useDeviceInfo();
  const [lastVisitedWave, setLastVisitedWave] = useState<string | null>(null);
  const [lastVisitedDm, setLastVisitedDm] = useState<string | null>(null);
  const [homeActiveTab, setHomeActiveTab] = useState<HomeTab>(() =>
    getStoredHomeTab()
  );
  const waveParam = searchParams.get("wave");
  const viewParam = searchParams.get("view");
  const lastFetchedWaveIdRef = useRef<string | null>(null);

  // Derived state: activeView is computed from URL params, not stored in state
  const activeView = useMemo<ViewKey | null>(() => {
    if (waveParam) {
      return null;
    }
    return viewParam ? (viewParam as ViewKey) : null;
  }, [waveParam, viewParam]);

  useEffect(() => {
    const { window: browserWindow } = globalThis as typeof globalThis & {
      window?: Window | undefined;
    };

    const handleTabEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ tab?: HomeTab | undefined }>)
        .detail;
      const tab = detail.tab;
      if (tab !== "feed" && tab !== "latest") return;
      setHomeActiveTab(tab);
    };

    browserWindow.addEventListener(
      HOME_TAB_EVENT,
      handleTabEvent as EventListener
    );

    return () => {
      browserWindow.removeEventListener(
        HOME_TAB_EVENT,
        handleTabEvent as EventListener
      );
    };
  }, []);

  const fetchWaveDetails = useCallback((targetWaveId: string) => {
    commonApiFetch<ApiWave>({
      endpoint: `/waves/${targetWaveId}`,
    })
      .then((res) => {
        if (res.chat.scope.group?.is_direct_message) {
          setLastVisitedDm(res.id);
        } else {
          setLastVisitedWave(res.id);
        }
      })
      .catch((error: unknown) => {
        console.warn("Failed to fetch wave metadata", error);
      })
      .finally(() => {
        lastFetchedWaveIdRef.current = targetWaveId;
      });
  }, []);

  // Effect for fetching wave details - only handles the external API call
  useEffect(() => {
    if (waveParam && waveParam !== lastFetchedWaveIdRef.current) {
      fetchWaveDetails(waveParam);
    } else if (!waveParam) {
      lastFetchedWaveIdRef.current = null;
    }
  }, [waveParam, fetchWaveDetails]);

  const handleNavClick = useCallback(
    (item: NavItem) => {
      if (item.kind === "route") {
        if (item.name === "Stream") {
          // activeView will become null automatically when URL changes (no wave/view params)
          setLastVisitedWave(null);
          setLastVisitedDm(null);
          setHomeActiveTab("feed");
          setStoredHomeTab("feed");
          router.push(getHomeFeedRoute());
        } else if (item.name === "Home") {
          // activeView will become null automatically when URL changes
          setHomeActiveTab("latest");
          setStoredHomeTab("latest");
          router.push(getHomeLatestRoute());
        } else {
          router.push(item.href);
        }
      } else if (item.viewKey === "waves") {
        const currentWaveId = searchParams.get("wave");

        if (currentWaveId) {
          setLastVisitedWave(null);
          router.push(getWavesBaseRoute(isApp));
        } else if (lastVisitedWave) {
          router.push(
            getWaveRoute({
              waveId: lastVisitedWave,
              isDirectMessage: false,
              isApp,
            })
          );
        } else {
          router.push(getWavesBaseRoute(isApp));
        }
      } else {
        // item.viewKey === "messages" (only remaining case)
        const currentWaveId = searchParams.get("wave");

        if (currentWaveId) {
          setLastVisitedDm(null);
          router.push(getMessagesBaseRoute(isApp));
        } else if (lastVisitedDm) {
          router.push(
            getWaveRoute({
              waveId: lastVisitedDm,
              isDirectMessage: true,
              isApp,
            })
          );
        } else {
          router.push(getMessagesBaseRoute(isApp));
        }
      }
    },
    [router, lastVisitedWave, lastVisitedDm, isApp, searchParams]
  );

  const hardBack = useCallback(
    (v: ViewKey) => {
      if (v === "messages") {
        setLastVisitedDm(null);
        router.push(getMessagesBaseRoute(isApp));
      } else {
        // v === "waves" (only remaining case)
        setLastVisitedWave(null);
        router.push(getWavesBaseRoute(isApp));
      }
    },
    [router, setLastVisitedDm, setLastVisitedWave, isApp]
  );

  const clearLastVisited = useCallback((type: "wave" | "dm") => {
    if (type === "wave") {
      setLastVisitedWave(null);
    } else {
      setLastVisitedDm(null);
    }
  }, []);

  const providerValue = useMemo(
    () => ({
      activeView,
      handleNavClick,
      hardBack,
      homeActiveTab,
      clearLastVisited,
    }),
    [activeView, handleNavClick, hardBack, homeActiveTab, clearLastVisited]
  );

  return (
    <ViewContext.Provider value={providerValue}>
      {children}
    </ViewContext.Provider>
  );
};

export const useViewContext = (): ViewContextType => {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error("useViewContext must be used within a ViewProvider");
  }
  return context;
};
