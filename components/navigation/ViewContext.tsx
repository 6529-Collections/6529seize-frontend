"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import type { ViewKey, NavItem } from "./navTypes";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiWave } from "@/generated/models/ApiWave";
import { useSearchParams, useRouter } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import {
  getHomeFeedRoute,
  getHomeLatestRoute,
  getMessagesBaseRoute,
  getWaveRoute,
  getWavesBaseRoute,
} from "@/helpers/navigation.helpers";
import {
  HOME_TAB_EVENT,
  HomeTab,
  getStoredHomeTab,
  setStoredHomeTab,
} from "@/components/home/useHomeTabs";

interface ViewContextType {
  activeView: ViewKey | null;
  hardBack: (v: ViewKey) => void;
  handleNavClick: (item: NavItem) => void;
  homeActiveTab: HomeTab;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ readonly children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isApp } = useDeviceInfo();
  const [activeView, setActiveView] = useState<ViewKey | null>(null);
  const [lastVisitedWave, setLastVisitedWave] = useState<string | null>(null);
  const [lastVisitedDm, setLastVisitedDm] = useState<string | null>(null);
  const [homeActiveTab, setHomeActiveTab] = useState<HomeTab>(() =>
    getStoredHomeTab()
  );
  const waveParam = searchParams?.get("wave");
  const viewParam = searchParams?.get("view");
  const [lastFetchedWaveId, setLastFetchedWaveId] = useState<string | null>(null);

  useEffect(() => {
    const { window: browserWindow } = globalThis as typeof globalThis & {
      window?: Window;
    };
    if (browserWindow === undefined) {
      return;
    }

    const handleTabEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ tab?: HomeTab }>).detail;
      const tab = detail?.tab;
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
        if (!res) {
          return;
        }
        if (res.chat.scope.group?.is_direct_message) {
          setLastVisitedDm(res.id);
        } else {
          setLastVisitedWave(res.id);
        }
      })
      .catch((error) => {
        console.warn("Failed to fetch wave metadata", error);
      })
      .finally(() => {
        setLastFetchedWaveId(targetWaveId);
      });
  }, []);

  useEffect(() => {
    if (waveParam) {
      setActiveView(null);
      if (waveParam !== lastFetchedWaveId) {
        fetchWaveDetails(waveParam);
      }
    } else {
      if (lastFetchedWaveId !== null) {
        setLastFetchedWaveId(null);
      }
      if (viewParam) {
        setActiveView(viewParam as ViewKey);
      } else {
        setActiveView(null);
      }
    }
  }, [waveParam, viewParam, fetchWaveDetails, lastFetchedWaveId]);

  const handleNavClick = useCallback(
    async (item: NavItem) => {
      if (item.kind === "route") {
        if (item.name === "Stream") {
          setActiveView(null);
          setLastVisitedWave(null);
          setLastVisitedDm(null);
          setHomeActiveTab("feed");
          setStoredHomeTab("feed");
          router.push(getHomeFeedRoute());
        } else if (item.name === "Home") {
          setActiveView(null);
          setHomeActiveTab("latest");
          setStoredHomeTab("latest");
          router.push(getHomeLatestRoute());
        } else {
          router.push(item.href);
        }
      } else if (item.kind === "view" && item.viewKey === "waves") {
        if (lastVisitedWave) {
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
      } else if (item.kind === "view" && item.viewKey === "messages") {
        if (lastVisitedDm) {
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
    [router, lastVisitedWave, lastVisitedDm, isApp]
  );

  const hardBack = useCallback(
    (v: ViewKey) => {
      if (v === "messages") {
        setLastVisitedDm(null);
        router.push(getMessagesBaseRoute(isApp));
      } else if (v === "waves") {
        setLastVisitedWave(null);
        router.push(getWavesBaseRoute(isApp));
      }
    },
    [router, setLastVisitedDm, setLastVisitedWave, isApp]
  );

  const providerValue = useMemo(
    () => ({ activeView, handleNavClick, hardBack, homeActiveTab }),
    [activeView, handleNavClick, hardBack, homeActiveTab]
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
