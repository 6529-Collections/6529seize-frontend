"use client";

import type { ReactNode } from "react";
import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useState,
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
  getNavHref: (item: NavItem) => string;
  recordNavClick: (item: NavItem) => void;
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
  const isMountedRef = useRef(false);
  const [, setNavCacheRevision] = useState(0);
  const lastVisitedWaveId = lastVisitedWaveRef.current;
  const lastVisitedDmId = lastVisitedDmRef.current;
  const currentIsDm = currentIsDmRef.current;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const bumpNavCacheRevision = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    setNavCacheRevision((revision) => revision + 1);
  }, []);

  const fetchWaveDetails = useCallback(
    async (targetWaveId: string) => {
      try {
        const res = await commonApiFetch<ApiWave>({
          endpoint: `waves/${targetWaveId}`,
        });
        const fetchedIsDm = Boolean(res.chat.scope.group?.is_direct_message);
        currentIsDmRef.current = fetchedIsDm;

        if (fetchedIsDm) {
          lastVisitedDmRef.current = res.id;
        } else {
          lastVisitedWaveRef.current = res.id;
        }
        bumpNavCacheRevision();
      } catch (error: unknown) {
        console.warn("Failed to fetch wave metadata", error);
      } finally {
        lastFetchedWaveIdRef.current = targetWaveId;
      }
    },
    [bumpNavCacheRevision]
  );

  // Effect for fetching wave details - only handles the external API call
  useEffect(() => {
    if (currentWaveId && currentWaveId !== lastFetchedWaveIdRef.current) {
      void fetchWaveDetails(currentWaveId);
    } else if (!currentWaveId) {
      lastFetchedWaveIdRef.current = null;
      currentIsDmRef.current = false;
    }
  }, [currentWaveId, fetchWaveDetails]);

  useEffect(() => {
    if (!isApp) {
      return;
    }

    router.prefetch(getWavesBaseRoute(isApp));
    router.prefetch(getMessagesBaseRoute(isApp));
  }, [isApp, router]);

  const getNavHref = useCallback(
    (item: NavItem) => {
      if (item.kind === "route") {
        if (item.name === "Home") {
          return getHomeRoute();
        }

        return item.href;
      }

      if (item.viewKey === "waves") {
        if (currentWaveId && !currentIsDm) {
          return getWavesBaseRoute(isApp);
        }

        if (lastVisitedWaveId) {
          return getWaveRoute({
            waveId: lastVisitedWaveId,
            isDirectMessage: false,
            isApp,
          });
        }

        return getWavesBaseRoute(isApp);
      }

      if (currentWaveId && currentIsDm) {
        // item.viewKey === "messages" (only remaining case)
        return getMessagesBaseRoute(isApp);
      }

      if (lastVisitedDmId) {
        return getWaveRoute({
          waveId: lastVisitedDmId,
          isDirectMessage: true,
          isApp,
        });
      }

      return getMessagesBaseRoute(isApp);
    },
    [currentIsDm, currentWaveId, isApp, lastVisitedDmId, lastVisitedWaveId]
  );

  const recordNavClick = useCallback(
    (item: NavItem) => {
      if (item.kind === "route") {
        return;
      }

      if (item.viewKey === "waves") {
        if (currentWaveId && !currentIsDm) {
          lastVisitedWaveRef.current = null;
        }
        return;
      }

      if (currentWaveId && currentIsDm) {
        lastVisitedDmRef.current = null;
      }
    },
    [currentIsDm, currentWaveId]
  );

  const handleNavClick = useCallback(
    (item: NavItem) => {
      const href = getNavHref(item);
      recordNavClick(item);
      router.push(href);
    },
    [getNavHref, recordNavClick, router]
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
      getNavHref,
      recordNavClick,
      hardBack,
      clearLastVisited,
    }),
    [handleNavClick, getNavHref, recordNavClick, hardBack, clearLastVisited]
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
