import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type { ViewKey, NavItem, RouteNavItem } from "./navTypes";
import { useRouter } from "next/router";

interface ViewContextType {
  activeView: ViewKey | null;
  setActiveView: (v: ViewKey | null) => void;
  handleNavClick: (item: NavItem) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ readonly children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewKey | null>(null);
  const [lastVisitedWave, setLastVisitedWave] = useState<string | null>(null);
  const [lastVisitedPath, setLastVisitedPath] = useState<string | null>(null);

  useEffect(() => {
    if (
      router.pathname.startsWith("/my-stream") &&
      !router.pathname.includes("notifications")
    ) {
      const { query } = router;
      if (query.wave) {
        setLastVisitedWave(query.wave as string);
      } else {
        setLastVisitedWave(null);
      }
    }
    setLastVisitedPath(router.pathname);

    const viewParam = typeof router.query.view === "string" ? router.query.view : null;
    if (viewParam === "waves" || viewParam === "messages") {
      setActiveView(viewParam as ViewKey);
    } else {
      setActiveView(null);
    }
  }, [router.asPath, router.pathname]);

  // Strip wave param when user navigates to waves list so components relying on waveId do not treat current page as a single wave
  useEffect(() => {
    const viewParam = typeof router.query.view === "string" ? router.query.view : null;
    const hasWave = "wave" in router.query;
    if (viewParam === "waves" && hasWave) {
      setLastVisitedWave(null);
      const { wave, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
    }
  }, [router.query.view, router.query.wave, router.pathname, router]);

  const getHref = useCallback(
    (item: RouteNavItem) => {
      if (
        item.name === "Stream" &&
        lastVisitedPath?.startsWith("/my-stream") &&
        !lastVisitedPath.includes("notifications") &&
        lastVisitedWave && !activeView
      ) {
        return item.href;
      }
      if (item.name === "Stream" && lastVisitedWave) {
        return `/my-stream?wave=${lastVisitedWave}`;
      } else {
        return item.href;
      }
    },
    [lastVisitedWave, lastVisitedPath, activeView]
  );

  const handleRouteClick = useCallback(
    (item: RouteNavItem) => {
      const href = getHref(item);
      router.push(href, undefined, { shallow: true }).then(() => {
        setActiveView(null);
      });
    },
    [getHref, lastVisitedWave, lastVisitedPath, activeView]
  );

  const handleNavClick = useCallback(
    (item: NavItem) => {
      if (item.kind === "route") {
        handleRouteClick(item);
        return;
      }

      if (item.viewKey === "waves" && lastVisitedWave) {
        router.push(`/my-stream?wave=${lastVisitedWave}`, undefined, {
          shallow: true,
        });
        setActiveView(null);
      } else {
        setActiveView(item.viewKey);
      }
    },
    [handleRouteClick, setActiveView, lastVisitedWave, router]
  );

  const providerValue = useMemo(
    () => ({ activeView, setActiveView, handleNavClick }),
    [activeView, setActiveView]
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
