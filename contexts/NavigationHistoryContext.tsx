"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  useRef,
  useMemo,
  Suspense,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ViewKey } from "@/components/navigation/navTypes";
import { useViewContext } from "@/components/navigation/ViewContext";
import {
  getActiveWaveIdFromUrl,
  getMessagePathRoute,
  getWavePathRoute,
  mainSegment,
  sameMainPath,
} from "@/helpers/navigation.helpers";

interface StackRoute {
  type: "route";
  path: string;
}
interface StackView {
  type: "view";
  view: ViewKey;
}

type StackEntry = StackRoute | StackView;
type MutableRef<T> = { current: T };
type SearchParamsLike = Pick<URLSearchParams, "toString"> | null | undefined;

interface NavigationHistoryContextValue {
  canGoBack: boolean;
  goBack: () => void;
  pushView: (view: ViewKey) => void;
}

const Context = createContext<NavigationHistoryContextValue | undefined>(
  undefined
);
const MAX_STACK = 50;

const getFullPath = (
  pathname: string | null | undefined,
  searchParams: SearchParamsLike
): string => {
  const search = searchParams?.toString();
  const path = pathname ?? "/";
  return search ? `${path}?${search}` : path;
};

const getRoutePathKey = (
  pathname: string | null | undefined,
  searchParams: SearchParamsLike
): string => {
  const url = getFullPath(pathname, searchParams);
  const isProfile = pathname?.startsWith("/[user]");
  const [pathOnly, searchOnly = ""] = url.split("?");
  const activeWaveId = getActiveWaveIdFromUrl({
    pathname: pathOnly,
    searchParams: new URLSearchParams(searchOnly),
  });
  const isWaveRoute =
    Boolean(activeWaveId) &&
    (pathOnly === "/" ||
      pathOnly?.startsWith("/waves") ||
      pathOnly?.startsWith("/messages"));

  if (isProfile) {
    return mainSegment(url);
  }

  if (isWaveRoute && activeWaveId) {
    const isMessagesRoute = pathOnly?.startsWith("/messages");
    return isMessagesRoute
      ? getMessagePathRoute(activeWaveId)
      : getWavePathRoute(activeWaveId);
  }

  return url.split(/[?#]/)[0]!;
};

const getInitialSearchParams = (): URLSearchParams => {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.search);
};

function NavigationHistoryRouteTracker({
  pushStack,
  skipNext,
  prevPathRef,
}: {
  readonly pushStack: (entry: StackRoute) => void;
  readonly skipNext: MutableRef<boolean>;
  readonly prevPathRef: MutableRef<string>;
}) {
  const pathname = usePathname();
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense covered by NavigationHistoryProvider Suspense wrapper
  const searchParams = useSearchParams();
  const fullPath = getFullPath(pathname, searchParams);

  useEffect(() => {
    const url = fullPath;

    if (skipNext.current) {
      skipNext.current = false;
      return;
    }

    if (url === prevPathRef.current) return;
    prevPathRef.current = url;

    pushStack({
      type: "route",
      path: getRoutePathKey(pathname, searchParams),
    });
  }, [fullPath, pathname, searchParams, pushStack, skipNext, prevPathRef]);

  return null;
}

export const NavigationHistoryProvider: React.FC<{
  readonly children: ReactNode;
}> = ({ children }) => {
  const { hardBack } = useViewContext();
  const pathname = usePathname();
  const router = useRouter();

  const historyRef = useRef<StackEntry[]>([
    {
      type: "route",
      path: getRoutePathKey(pathname, getInitialSearchParams()),
    },
  ]);
  const [index, setIndex] = useState(0);
  const skipNext = useRef(false);
  const prevPathRef = useRef<string>("");

  const canGoBack = useMemo(() => {
    if (index === 0) return false;
    const current = historyRef.current[index];
    const currentPath = current?.type === "route" ? current.path : null;

    for (let i = index - 1; i >= 0; i--) {
      const entry = historyRef.current[i];
      if (entry?.type === "view") return true;
      if (entry?.type === "route") {
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

  const pushRouteEntry = useCallback(
    (entry: StackRoute) => {
      let i = historyRef.current.length - 1;
      while (i >= 0 && historyRef.current[i]?.type === "view") i -= 1;
      const lastRoute = i >= 0 ? historyRef.current[i] : null;
      const isDuplicate =
        lastRoute?.type === "route" && lastRoute.path === entry.path;
      if (!isDuplicate) {
        pushStack(entry);
      }
    },
    [pushStack]
  );

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
          entry?.type === "route" &&
          current?.type === "route" &&
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
      if (target?.type === "route") {
        skipNext.current = true;
        router.push(target.path);
      } else {
        hardBack(target!.view);
      }
      return targetIndex;
    });
  }, [canGoBack, router, hardBack]);

  const value = useMemo(
    () => ({ canGoBack, goBack, pushView }),
    [canGoBack, goBack, pushView]
  );

  return (
    <Context.Provider value={value}>
      <Suspense fallback={null}>
        <NavigationHistoryRouteTracker
          pushStack={pushRouteEntry}
          skipNext={skipNext}
          prevPathRef={prevPathRef}
        />
      </Suspense>
      {children}
    </Context.Provider>
  );
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
