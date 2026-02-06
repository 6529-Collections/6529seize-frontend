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
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import {
  getActiveWaveIdFromUrl,
  getHomeRoute,
  getMessagesBaseRoute,
  getWaveRoute,
  getWavesBaseRoute,
} from "@/helpers/navigation.helpers";

interface ViewContextType {
  activeView: ViewKey | null;
  hardBack: (v: ViewKey) => void;
  handleNavClick: (item: NavItem) => void;
  clearLastVisited: (type: "wave" | "dm") => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ readonly children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isApp } = useDeviceInfo();
  const [lastVisitedWave, setLastVisitedWave] = useState<string | null>(null);
  const [lastVisitedDm, setLastVisitedDm] = useState<string | null>(null);
  const waveParam = getActiveWaveIdFromUrl({ pathname, searchParams });
  const viewParam = searchParams.get("view");
  const lastFetchedWaveIdRef = useRef<string | null>(null);

  const activeView = useMemo<ViewKey | null>(() => {
    if (waveParam) {
      return null;
    }
    return viewParam ? (viewParam as ViewKey) : null;
  }, [waveParam, viewParam]);

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
        if (item.name === "Home") {
          router.push(getHomeRoute());
        } else {
          router.push(item.href);
        }
      } else if (item.viewKey === "waves") {
        const currentWaveId = getActiveWaveIdFromUrl({
          pathname,
          searchParams,
        });

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
        const currentWaveId = getActiveWaveIdFromUrl({
          pathname,
          searchParams,
        });

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
    [router, lastVisitedWave, lastVisitedDm, isApp, pathname, searchParams]
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
      clearLastVisited,
    }),
    [activeView, handleNavClick, hardBack, clearLastVisited]
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
