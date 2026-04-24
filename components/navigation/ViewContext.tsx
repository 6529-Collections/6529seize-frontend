"use client";

import type { ReactNode } from "react";
import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { ViewKey, NavItem } from "./navTypes";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useRouter } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import {
  getHomeRoute,
  getMessagesBaseRoute,
  getWaveRoute,
  getWavesBaseRoute,
} from "@/helpers/navigation.helpers";

interface ViewContextType {
  hardBack: (v: ViewKey) => void;
  handleNavClick: (item: NavItem) => void;
  clearLastVisited: (type: "wave" | "dm") => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

interface SearchParamsLike {
  get: (key: string) => string | null;
}

const normalizeViewParam = (value: string | null): ViewKey | null => {
  if (value === "waves" || value === "messages") {
    return value;
  }

  return null;
};

export const getActiveViewFromUrl = ({
  activeWaveId,
  searchParams,
}: {
  readonly activeWaveId: string | null | undefined;
  readonly searchParams: SearchParamsLike | null | undefined;
}): ViewKey | null => {
  if (activeWaveId) {
    return null;
  }

  return normalizeViewParam(searchParams?.get("view") ?? null);
};

export const ViewProvider: React.FC<{ readonly children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const myStream = useMyStreamOptional();
  const { isApp } = useDeviceInfo();
  const currentWaveId = myStream?.activeWave.id ?? null;
  const lastVisitedWaveRef = useRef<string | null>(null);
  const lastVisitedDmRef = useRef<string | null>(null);
  const lastFetchedWaveIdRef = useRef<string | null>(null);
  const currentIsDmRef = useRef(false);

  const fetchWaveDetails = useCallback(async (targetWaveId: string) => {
    try {
      const res = await commonApiFetch<ApiWave>({
        endpoint: `waves/${targetWaveId}`,
      });
      const currentIsDm = Boolean(res.chat.scope.group?.is_direct_message);
      currentIsDmRef.current = currentIsDm;

      if (currentIsDm) {
        lastVisitedDmRef.current = res.id;
      } else {
        lastVisitedWaveRef.current = res.id;
      }
    } catch (error: unknown) {
      console.warn("Failed to fetch wave metadata", error);
    } finally {
      lastFetchedWaveIdRef.current = targetWaveId;
    }
  }, []);

  // Effect for fetching wave details - only handles the external API call
  useEffect(() => {
    if (currentWaveId && currentWaveId !== lastFetchedWaveIdRef.current) {
      void fetchWaveDetails(currentWaveId);
    } else if (!currentWaveId) {
      lastFetchedWaveIdRef.current = null;
      currentIsDmRef.current = false;
    }
  }, [currentWaveId, fetchWaveDetails]);

  const handleNavClick = useCallback(
    (item: NavItem) => {
      if (item.kind === "route") {
        if (item.name === "Home") {
          router.push(getHomeRoute());
        } else {
          router.push(item.href);
        }
      } else if (item.viewKey === "waves") {
        if (currentWaveId && !currentIsDmRef.current) {
          lastVisitedWaveRef.current = null;
          router.push(getWavesBaseRoute(isApp));
        } else if (lastVisitedWaveRef.current) {
          router.push(
            getWaveRoute({
              waveId: lastVisitedWaveRef.current,
              isDirectMessage: false,
              isApp,
            })
          );
        } else {
          router.push(getWavesBaseRoute(isApp));
        }
      } else if (currentWaveId && currentIsDmRef.current) {
        // item.viewKey === "messages" (only remaining case)
        lastVisitedDmRef.current = null;
        router.push(getMessagesBaseRoute(isApp));
      } else if (lastVisitedDmRef.current) {
        router.push(
          getWaveRoute({
            waveId: lastVisitedDmRef.current,
            isDirectMessage: true,
            isApp,
          })
        );
      } else {
        router.push(getMessagesBaseRoute(isApp));
      }
    },
    [router, currentWaveId, isApp]
  );

  const hardBack = useCallback(
    (v: ViewKey) => {
      if (v === "messages") {
        lastVisitedDmRef.current = null;
        router.push(getMessagesBaseRoute(isApp));
      } else {
        // v === "waves" (only remaining case)
        lastVisitedWaveRef.current = null;
        router.push(getWavesBaseRoute(isApp));
      }
    },
    [router, isApp]
  );

  const clearLastVisited = useCallback((type: "wave" | "dm") => {
    if (type === "wave") {
      lastVisitedWaveRef.current = null;
    } else {
      lastVisitedDmRef.current = null;
    }
  }, []);

  const providerValue = useMemo(
    () => ({
      handleNavClick,
      hardBack,
      clearLastVisited,
    }),
    [handleNavClick, hardBack, clearLastVisited]
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
