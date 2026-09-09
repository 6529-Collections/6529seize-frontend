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
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ViewKey } from "@/components/navigation/navTypes";
import { useViewContext } from "@/components/navigation/ViewContext";
import type { BrainView } from "@/components/brain/mobile/brainMobileViews";
import {
  getActiveWaveIdFromUrl,
  getMessagePathRoute,
  getWavePathRoute,
  mainSegment,
  sameMainPath,
} from "@/helpers/navigation.helpers";

interface WaveViewSelection {
  readonly waveId: string;
  readonly view: BrainView;
}

interface StackRoute {
  type: "route";
  path: string;
  waveView?: WaveViewSelection;
}
interface StackView {
  type: "view";
  view: ViewKey;
}

type StackEntry = StackRoute | StackView;

interface NavigationHistoryContextValue {
  canGoBack: boolean;
  goBack: () => void;
  goBackTo: (path: string) => void;
  pushView: (view: ViewKey) => void;
  currentWaveView: WaveViewSelection | null;
  rememberWaveView: (selection: WaveViewSelection) => void;
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

  const [currentWaveView, setCurrentWaveView] =
    useState<WaveViewSelection | null>(null);

  const rememberWaveView = useCallback(
    (selection: WaveViewSelection) => {
      const entry = historyRef.current[index];
      if (entry?.type !== "route") return;

      const entryWaveId = getActiveWaveIdFromUrl({
        pathname: entry.path,
        searchParams: new URLSearchParams(),
      });
      if (entryWaveId !== selection.waveId) return;

      // Keep the selected tab with this visit, not with every visit to the wave.
      entry.waveView = selection;
      setCurrentWaveView(selection);
    },
    [index]
  );

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
    setCurrentWaveView(null);
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
      prevPathRef.current = url;
      return;
    }

    if (url === prevPathRef.current) return;
    prevPathRef.current = url;

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

    let pathKey: string;
    if (isProfile) {
      pathKey = mainSegment(url);
    } else if (isWaveRoute && activeWaveId) {
      const isMessagesRoute = pathOnly?.startsWith("/messages");
      pathKey = isMessagesRoute
        ? getMessagePathRoute(activeWaveId)
        : getWavePathRoute(activeWaveId);
    } else {
      pathKey = url.split(/[?#]/)[0]!;
    }

    let i = historyRef.current.length - 1;
    while (i >= 0 && historyRef.current[i]?.type === "view") i -= 1;
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
    let targetIndex = index - 1;
    const current = historyRef.current[index];

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
      return;
    }

    const target = historyRef.current[targetIndex];
    historyRef.current = historyRef.current.slice(0, targetIndex + 1);
    setCurrentWaveView(
      target?.type === "route" ? (target.waveView ?? null) : null
    );
    if (target?.type === "route") {
      skipNext.current = true;
      router.push(target.path);
    } else {
      hardBack(target!.view);
    }
    setIndex(targetIndex);
  }, [canGoBack, index, router, hardBack]);

  const goBackTo = useCallback(
    (path: string) => {
      let targetIndex = index - 1;
      while (targetIndex >= 0) {
        const entry = historyRef.current[targetIndex];
        if (entry?.type === "route" && sameMainPath(entry.path, path)) {
          break;
        }
        targetIndex -= 1;
      }

      skipNext.current = true;
      if (targetIndex < 0) {
        historyRef.current = [
          ...historyRef.current.slice(0, index),
          { type: "route", path },
        ];
        setCurrentWaveView(null);
        router.replace(path);
        return;
      }

      const target = historyRef.current[targetIndex];
      setCurrentWaveView(
        target?.type === "route" ? (target.waveView ?? null) : null
      );
      router.push(path);
      historyRef.current = historyRef.current.slice(0, targetIndex + 1);
      setIndex(targetIndex);
    },
    [index, router]
  );

  const value = useMemo(
    () => ({
      canGoBack,
      goBack,
      goBackTo,
      pushView,
      currentWaveView,
      rememberWaveView,
    }),
    [canGoBack, goBack, goBackTo, pushView, currentWaveView, rememberWaveView]
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
