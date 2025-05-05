import { createContext, useContext, useEffect, useCallback, useState, ReactNode, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import type { ViewKey } from "../components/navigation/navTypes";
import { useViewContext } from "../components/navigation/ViewContext";

type StackEntry =
  | { type: "route"; path: string }
  | { type: "view"; view: ViewKey };

interface NavigationHistoryContextValue {
  canGoBack: boolean;
  goBack: () => void;
  pushView: (view: ViewKey) => void;
}

const NavigationHistoryContext = createContext<NavigationHistoryContextValue | undefined>(undefined);

const MAX_STACK = 50;

// DEBUG LOGGER
const DEBUG_NAV = typeof window !== "undefined" && process.env.NEXT_PUBLIC_DEBUG_NAV === "true";
const dlog = (...args: unknown[]): void => {
  if (DEBUG_NAV) console.log("[NavigationHistory]", ...args);
};

export const NavigationHistoryProvider: React.FC<{ readonly children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const historyRef = useRef<StackEntry[]>([{ type: "route", path: router.asPath }]);
  const { setActiveView } = useViewContext();

  const canGoBack = index > 0;

  const pushStack = useCallback((entry: StackEntry) => {
    dlog("pushStack", { entry, prevIndex: index });
    historyRef.current = [
      ...historyRef.current.slice(0, index + 1),
      entry,
    ].slice(-MAX_STACK);
    setIndex(Math.min(index + 1, MAX_STACK - 1));
    dlog("stackSnapshot", historyRef.current.map((e, i) => ({ i, ...e })));
  }, [index]);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      dlog("routeChangeComplete", url);
      const last = historyRef.current[index];
      if (last?.type === "route" && last.path === url) return;
      pushStack({ type: "route", path: url });
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [index, pushStack, router.events]);

  const pushView = useCallback((view: ViewKey) => {
    dlog("pushView", view);
    return pushStack({ type: "view", view });
  }, [pushStack]);

  const goBack = useCallback(() => {
    dlog("goBack called", { canGoBack, index });
    if (!canGoBack) return;
    const target = historyRef.current[index - 1];
    dlog("goBack target", target);
    setIndex(index - 1);

    if (target.type === "route") {
      router.push(target.path, undefined, { shallow: true });
    } else {
      setActiveView(target.view);
    }
  }, [canGoBack, index, router, setActiveView]);

  const contextValue = useMemo<NavigationHistoryContextValue>(() => ({ canGoBack, goBack, pushView }), [canGoBack, goBack, pushView]);

  return <NavigationHistoryContext.Provider value={contextValue}>{children}</NavigationHistoryContext.Provider>;
};

export const useNavigationHistoryContext = (): NavigationHistoryContextValue => {
  const ctx = useContext(NavigationHistoryContext);
  if (!ctx) throw new Error("useNavigationHistoryContext must be used within NavigationHistoryProvider");
  return ctx;
}; 