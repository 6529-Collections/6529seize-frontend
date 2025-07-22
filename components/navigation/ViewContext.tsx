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

interface ViewContextType {
  activeView: ViewKey | null;
  hardBack: (v: ViewKey) => void;
  handleNavClick: (item: NavItem) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ readonly children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<ViewKey | null>(null);
  const [lastVisitedWave, setLastVisitedWave] = useState<string | null>(null);
  const [lastVisitedDm, setLastVisitedDm] = useState<string | null>(null);

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
        // For Stream navigation, ensure clean route without query params
        if (item.name === "Stream" && item.href === "/my-stream") {
          router.push("/my-stream");
        } else {
          router.push(item.href);
        }
      } else if (item.viewKey === "waves" && lastVisitedWave) {
        router.push(`/my-stream?wave=${lastVisitedWave}`);
      } else if (item.viewKey === "waves") {
        router.push("/my-stream?view=waves");
      } else if (item.viewKey === "messages" && lastVisitedDm) {
        router.push(`/my-stream?wave=${lastVisitedDm}`);
      } else if (item.viewKey === "messages") {
        router.push("/my-stream?view=messages");
      }
    },
    [router, lastVisitedWave, lastVisitedDm]
  );

  const hardBack = useCallback(
    (v: ViewKey) => {
      if (v === "messages") {
        setLastVisitedDm(null);
        router.push("/my-stream?view=messages");
      } else if (v === "waves") {
        setLastVisitedWave(null);
        router.push("/my-stream?view=waves");
      }
    },
    [router, setLastVisitedDm, setLastVisitedWave]
  );

  const providerValue = useMemo(
    () => ({ activeView, handleNavClick, hardBack }),
    [activeView, handleNavClick, hardBack]
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
