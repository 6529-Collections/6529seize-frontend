import { createContext, useContext, useEffect, useCallback, useState, ReactNode, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import type { ViewKey } from "../components/navigation/navTypes";
import { useViewContext } from "../components/navigation/ViewContext";

interface StackRoute { type: "route"; path: string }
interface StackView { type: "view"; view: ViewKey }

type StackEntry = StackRoute | StackView;

interface NavigationHistoryContextValue {
  canGoBack: boolean;
  goBack: () => void;
  pushView: (view: ViewKey) => void;
}

const Context = createContext<NavigationHistoryContextValue | undefined>(undefined);
const MAX_STACK = 50;

const canonical = (url: string): string => {
  const pathname = url.split("?")[0];
  const m = pathname.match(/^\/([^/]+)(?:\/.*)?$/);
  return m ? `/${m[1]}` : pathname;
};

export const NavigationHistoryProvider: React.FC<{ readonly children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { setActiveView } = useViewContext();

  const historyRef = useRef<StackEntry[]>([{ type: "route", path: canonical(router.asPath) }]);
  const [index, setIndex] = useState(0);
  const skipNext = useRef(false);

  const canGoBack = index > 0;

  const pushStack = useCallback((entry: StackEntry) => {
    setIndex(prev => {
      const newHistory = [...historyRef.current.slice(0, prev + 1), entry].slice(-MAX_STACK);
      historyRef.current = newHistory;
      return Math.min(prev + 1, MAX_STACK - 1);
    });
  }, []);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (skipNext.current) {
        skipNext.current = false;
        return;
      }
      const pathKey = canonical(url);
      const last = historyRef.current[historyRef.current.length - 1];
      const isDuplicate = last?.type === "route" && last.path === pathKey;
      if (isDuplicate && historyRef.current.length > 1) return;
      pushStack({ type: "route", path: pathKey });
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events, pushStack]);

  const pushView = useCallback((view: ViewKey) => pushStack({ type: "view", view }), [pushStack]);

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    setIndex(prev => {
      const target = historyRef.current[prev - 1];
      if (target.type === "route") {
        skipNext.current = true;
        router.push(target.path, undefined, { shallow: true });
      } else {
        setActiveView(target.view);
      }
      return prev - 1;
    });
  }, [canGoBack, router, setActiveView]);

  const value = useMemo(() => ({ canGoBack, goBack, pushView }), [canGoBack, goBack, pushView]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useNavigationHistoryContext = (): NavigationHistoryContextValue => {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useNavigationHistoryContext must be used within NavigationHistoryProvider");
  return ctx;
}; 