"use client";

import type { ReactNode } from "react";
import { useWaveInformation } from "./WaveInformationContext";
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
import { Capacitor } from "@capacitor/core";
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
  // Kept separately so filter changes never become extra Back steps.
  href?: string;
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

const isCollectPath = (path: string) =>
  path === "/collect" || path === "/collect/orders";

function canReturnToRoute(
  currentPath: string,
  targetPath: string,
  targetHref: string | undefined
): boolean {
  if (Capacitor.isNativePlatform() && isCollectPath(currentPath)) {
    // The synthetic root entry is not a page the user actually visited.
    return Boolean(targetHref) && targetPath !== currentPath;
  }
  return !sameMainPath(targetPath, currentPath);
}

function hasBackDestination(history: readonly StackEntry[], index: number) {
  const current = history[index];
  for (let i = index - 1; i >= 0; i--) {
    const entry = history[i];
    if (entry?.type === "view") return true;
    if (
      entry?.type === "route" &&
      (current?.type !== "route" ||
        canReturnToRoute(current.path, entry.path, entry.href))
    ) {
      return true;
    }
  }
  return false;
}

function getHistoryRoutePath(url: string, pathname: string): string {
  if (pathname.startsWith("/[user]")) return mainSegment(url);

  const [pathOnly = "", searchOnly = ""] = url.split("?");
  const activeWaveId = getActiveWaveIdFromUrl({
    pathname: pathOnly,
    searchParams: new URLSearchParams(searchOnly),
  });
  const isWaveRoute =
    Boolean(activeWaveId) &&
    (pathOnly === "/" ||
      pathOnly.startsWith("/waves") ||
      pathOnly.startsWith("/messages"));

  if (isWaveRoute && activeWaveId) {
    return pathOnly.startsWith("/messages")
      ? getMessagePathRoute(activeWaveId)
      : getWavePathRoute(activeWaveId);
  }
  return url.split(/[?#]/)[0]!;
}

export const NavigationHistoryProvider: React.FC<{
  readonly children: ReactNode;
}> = ({ children }) => {
  const { hardBack } = useViewContext();
  const information = useWaveInformation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const fullPath =
    pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
  const historyRef = useRef<StackEntry[]>([
    { type: "route", path: mainSegment(fullPath) },
  ]);
  const [{ index, canGoBack }, setPosition] = useState({
    index: 0,
    canGoBack: false,
  });
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

  const updatePosition = useCallback((nextIndex: number) => {
    setPosition({
      index: nextIndex,
      canGoBack: hasBackDestination(historyRef.current, nextIndex),
    });
  }, []);

  const pushStack = useCallback((entry: StackEntry) => {
    setCurrentWaveView(null);
    setPosition((previous) => {
      const newHistory = [
        ...historyRef.current.slice(0, previous.index + 1),
        entry,
      ].slice(-MAX_STACK);
      historyRef.current = newHistory;
      const nextIndex = newHistory.length - 1;
      return {
        index: nextIndex,
        canGoBack: hasBackDestination(newHistory, nextIndex),
      };
    });
  }, []);

  useEffect(() => {
    const url = fullPath;
    if (skipNext.current) {
      skipNext.current = false;
      prevPathRef.current = url;
      const current = historyRef.current.at(-1);
      if (current?.type === "route" && Capacitor.isNativePlatform()) {
        current.href = url + globalThis.location.hash;
      }
      return;
    }

    if (url === prevPathRef.current) return;
    prevPathRef.current = url;

    const pathKey = getHistoryRoutePath(url, pathname);
    let i = historyRef.current.length - 1;
    while (i >= 0 && historyRef.current[i]?.type === "view") i -= 1;
    const lastRoute = i >= 0 ? historyRef.current[i] : null;
    const isDuplicate =
      lastRoute?.type === "route" && lastRoute.path === pathKey;
    const href = Capacitor.isNativePlatform()
      ? url + globalThis.location.hash
      : undefined;
    if (isDuplicate) {
      if (href) historyRef.current[i] = { ...lastRoute, href };
    } else {
      pushStack({ type: "route", path: pathKey, ...(href && { href }) });
    }
  }, [fullPath, pathname, searchParams, pushStack]);

  const pushView = useCallback(
    (view: ViewKey) => {
      pushStack({ type: "view", view });
    },
    [pushStack]
  );

  const goBack = useCallback(() => {
    if (information?.returnFromNavigation) {
      information.returnFromNavigation();
      return;
    }
    if (information?.request?.overlay) {
      information.close();
      return;
    }
    if (!canGoBack) return;
    let targetIndex = index - 1;
    const current = historyRef.current[index];
    while (targetIndex >= 0) {
      const entry = historyRef.current[targetIndex];
      if (
        entry?.type === "route" &&
        current?.type === "route" &&
        !canReturnToRoute(current.path, entry.path, entry.href)
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
      const collectBack =
        Capacitor.isNativePlatform() &&
        current?.type === "route" &&
        isCollectPath(current.path);
      router.push(collectBack ? (target.href ?? target.path) : target.path);
    } else {
      hardBack(target!.view);
    }
    updatePosition(targetIndex);
  }, [canGoBack, index, router, hardBack, information, updatePosition]);

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
        updatePosition(index);
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
      updatePosition(targetIndex);
    },
    [index, router, updatePosition]
  );

  const value = useMemo(
    () => ({
      canGoBack: canGoBack || Boolean(information?.request?.overlay),
      goBack,
      goBackTo,
      pushView,
      currentWaveView,
      rememberWaveView,
    }),
    [
      canGoBack,
      goBack,
      goBackTo,
      pushView,
      currentWaveView,
      rememberWaveView,
      information,
    ]
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
