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

// DEBUG LOGGER
const DEBUG_NAV = typeof window !== "undefined" && process.env.NEXT_PUBLIC_DEBUG_NAV === "true";
const dlog = (...args: unknown[]): void => {
  if (DEBUG_NAV) console.log("[ViewContext]", ...args);
};

export const ViewProvider: React.FC<{ readonly children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewKey | null>(null);
  const [lastVisitedWave, setLastVisitedWave] = useState<string | null>(null);
  const [lastVisitedPath, setLastVisitedPath] = useState<string | null>(null);

  useEffect(() => {
    dlog("route/asPath changed", { pathname: router.pathname, asPath: router.asPath });
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
    setActiveView(null);
  }, [router.asPath, router.pathname]);

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
      dlog("handleRouteClick", { item, href: getHref(item) });
      const href = getHref(item);
      router.push(href, undefined, { shallow: true }).then(() => {
        setActiveView(null);
        dlog("route navigation finished", { href });
      });
    },
    [getHref, lastVisitedWave, lastVisitedPath, activeView]
  );

  const handleNavClick = useCallback(
    (item: NavItem) => {
      dlog("handleNavClick", { item, activeViewBefore: activeView });
      if (item.kind === "route") {
        handleRouteClick(item);
      } else {
        if (item.viewKey === "waves" && lastVisitedWave) {
          router.push(`/my-stream?wave=${lastVisitedWave}`, undefined, {
            shallow: true,
          });
          setActiveView(null);
        } else {
          setActiveView(item.viewKey);
        }
      }
      dlog("handleNavClick done", { activeViewAfter: item.kind === "view" ? item.viewKey : null });
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
