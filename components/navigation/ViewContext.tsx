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

  useEffect(() => {
    const wave = searchParams?.get("wave");
    const view = searchParams?.get("view");

    const getWave = async () => {
      const res = await commonApiFetch<ApiWave>({
        endpoint: `/waves/${wave}`,
      });
      if (!res) {
        return;
      }
      if (res.chat.scope.group?.is_direct_message) {
        setLastVisitedDm(res.id);
      } else {
        setLastVisitedWave(res.id);
      }
    };

    if (wave) {
      setActiveView(null);
      getWave();
    } else if (view) {
      setActiveView(view as ViewKey);
    } else {
      setActiveView(null);
    }
  }, [searchParams]);

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
