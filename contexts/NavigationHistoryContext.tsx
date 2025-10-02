"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  ReactNode,
  useRef,
  useMemo,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ViewKey } from "@/components/navigation/navTypes";
import { useViewContext } from "@/components/navigation/ViewContext";
import { mainSegment, sameMainPath } from "@/helpers/navigation.helpers";

interface StackRoute {
  type: "route";
  path: string;
}
interface StackView {
  type: "view";
  view: ViewKey;
}

type StackEntry = StackRoute | StackView;

interface NavigationHistoryContextValue {
  canGoBack: boolean;
  goBack: () => void;
  pushView: (view: ViewKey) => void;
}

const Context = createContext<NavigationHistoryContextValue | undefined>(
  undefined
);
const MAX_STACK = 50;

export const NavigationHistoryProvider: React.FC<{
  readonly children: ReactNode;
}> = ({ children }) => {
  const { hardBack } = useViewContext();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const fullPath =
    pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
  const historyRef = useRef<StackEntry[]>([
    { type: "route", path: mainSegment(fullPath) },
  ]);
  const [index, setIndex] = useState(0);
  const skipNext = useRef(false);
  const prevPathRef = useRef<string>("");

  const canGoBack = useMemo(() => {
    if (index === 0) return false;
    const current = historyRef.current[index];
    const currentPath = current.type === "route" ? current.path : null;

    for (let i = index - 1; i >= 0; i--) {
      const entry = historyRef.current[i];
      if (entry.type === "view") return true;
      if (entry.type === "route") {
        if (!currentPath) return true;
        if (!sameMainPath(entry.path, currentPath)) return true;
      }
    }
    return false;
  }, [index]);

  const pushStack = useCallback((entry: StackEntry) => {
    setIndex((prev) => {
      const newHistory = [
        ...historyRef.current.slice(0, prev + 1),
        entry,
      ].slice(-MAX_STACK);
      historyRef.current = newHistory;
      return Math.min(prev + 1, MAX_STACK - 1);
    });
  }, []);

  useEffect(() => {
    const url = fullPath;

    if (skipNext.current) {
      skipNext.current = false;
      return;
    }

    if (url === prevPathRef.current) return;
    prevPathRef.current = url;

    const isProfile = pathname?.startsWith("/[user]");
    const isMyStream = url.startsWith("/my-stream") && url.includes("wave=");

    let pathKey: string;
    if (isProfile) {
      pathKey = mainSegment(url);
    } else if (isMyStream) {
      pathKey = url.split("&")[0];
    } else {
      pathKey = url.split(/[?#]/)[0];
    }

    let i = historyRef.current.length - 1;
    while (i >= 0 && historyRef.current[i].type === "view") i -= 1;
    const lastRoute = i >= 0 ? historyRef.current[i] : null;
    const isDuplicate =
      lastRoute?.type === "route" && lastRoute.path === pathKey;
    if (!isDuplicate) {
      pushStack({ type: "route", path: pathKey });
    }
  }, [fullPath, pathname, searchParams, pushStack]);

  const pushView = useCallback(
    (view: ViewKey) => {
      pushStack({ type: "view", view });
    },
    [pushStack]
  );

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    setIndex((prev) => {
      let targetIndex = prev - 1;
      const current = historyRef.current[prev];

      while (targetIndex >= 0) {
        const entry = historyRef.current[targetIndex];
        if (
          entry.type === "route" &&
          current.type === "route" &&
          sameMainPath(entry.path, current.path)
        ) {
          targetIndex -= 1;
          continue;
        }
        break;
      }

      if (targetIndex < 0) {
        window.history.back();
        return prev;
      }

      const target = historyRef.current[targetIndex];
      if (target.type === "route") {
        skipNext.current = true;
        router.push(target.path);
      } else {
        hardBack(target.view);
      }
      return targetIndex;
    });
  }, [canGoBack, router, hardBack]);

  const value = useMemo(
    () => ({ canGoBack, goBack, pushView }),
    [canGoBack, goBack, pushView]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useNavigationHistoryContext =
  (): NavigationHistoryContextValue => {
    const ctx = useContext(Context);
    if (!ctx)
      throw new Error(
        "useNavigationHistoryContext must be used within NavigationHistoryProvider"
      );
    return ctx;
  };
