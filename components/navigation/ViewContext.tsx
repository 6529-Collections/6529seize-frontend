import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from "react";
import type { ViewKey, NavItem } from "./navTypes";
import { useRouter } from "next/router";

interface ViewContextType {
  activeView: ViewKey | null;
  setActiveView: (view: ViewKey | null) => void;
  handleClick: (item: NavItem) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ readonly children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewKey | null>(null);
  const [lastVisitedWave, setLastVisitedWave] = useState<string | null>(null);

  useEffect(() => {
    setActiveView(null);
    if (router.pathname.startsWith("/my-stream")) {
      const waveId = (() => {
        const queryMatch = router.asPath.match(/[?&]wave=([^&]+)/);
        if (queryMatch) return queryMatch[1];
        const pathMatch = router.asPath.match(/\/wave\/([^/?]+)/);
        if (pathMatch) return pathMatch[1];
        return null;
      })();

      if (waveId) {
        setLastVisitedWave(waveId);
      } else {
        setLastVisitedWave(null);
      }
    }
  }, [router.asPath]);

  const handleClick = (item: NavItem) => {
    if (item.kind === "route") {
      const extractWaveId = (path: string): string | null => {
        const queryMatch = path.match(/[?&]wave=([^&]+)/);
        if (queryMatch) return queryMatch[1];
        const pathMatch = path.match(/\/wave\/([^/?]+)/);
        if (pathMatch) return pathMatch[1];
        return null;
      };

      const isStreamIcon = item.href === "/my-stream";

      if (isStreamIcon) {
        if (activeView !== null) {
          setActiveView(null);
          return;
        }

        const currentWaveId = extractWaveId(router.asPath);

        if (currentWaveId) {
          router.push("/my-stream").then(() => setActiveView(null));
          return;
        }

        if (lastVisitedWave) {
          const currentPathBase = router.asPath.split("?")[0].replace(/\/$/, "");
          if (currentPathBase === "/my-stream") {
            router.push(`/my-stream?wave=${lastVisitedWave}`).then(() => setActiveView(null));
          } else {
            router.push(`/my-stream?wave=${lastVisitedWave}`).then(() => setActiveView(null));
          }
          return;
        }

        const currentPathBase = router.asPath.split("?")[0].replace(/\/$/, "");
        if (currentPathBase !== "/my-stream") {
          router.push("/my-stream").then(() => setActiveView(null));
        } else {
          setActiveView(null);
        }
        return;
      }

      const currentPathBase = router.asPath.split("?")[0].replace(/\/$/, "");
      const targetPathBase = item.href.split("?")[0].replace(/\/$/, "");

      if (currentPathBase !== targetPathBase) {
        router.push(item.href).then(() => setActiveView(null));
      } else {
        setActiveView(null);
      }
    } else {
      setActiveView(item.viewKey);
    }
  };

  const providerValue = useMemo(
    () => ({ activeView, setActiveView, handleClick }),
    [activeView, lastVisitedWave]
  );

  return (
    <ViewContext.Provider value={providerValue}>{children}</ViewContext.Provider>
  );
};

export const useViewContext = (): ViewContextType => {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error("useViewContext must be used within a ViewProvider");
  }
  return context;
};
