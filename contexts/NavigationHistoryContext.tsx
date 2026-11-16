"use client";

import type { ReactNode } from "react";
import { useWaveInformation } from "./WaveInformationContext";
import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useCallback,
  useState,
  useRef,
  useMemo,
} from "react";
import {
  type ReadonlyURLSearchParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
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
import { createNavigationScrollRestoration } from "@/helpers/navigation-scroll-restoration";

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

function getBackDestinationIndex(
  history: readonly StackEntry[],
  index: number
) {
  const current = history[index];
  for (let i = index - 1; i >= 0; i--) {
    const entry = history[i];
    if (entry?.type === "view") return i;
    if (
      entry?.type === "route" &&
      (current?.type !== "route" ||
        canReturnToRoute(current.path, entry.path, entry.href))
    ) {
      return i;
    }
  }
  return -1;
}

const hasBackDestination = (history: readonly StackEntry[], index: number) =>
  getBackDestinationIndex(history, index) >= 0;

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

function getHistoryHref(url: string, path: string) {
  const [pathname = "", query = ""] = url.split("?");
  const params = new URLSearchParams(query);
  if (
    (pathname === "/" || pathname === "/waves" || pathname === "/messages") &&
    params.has("wave") &&
    path !== pathname
  ) {
    params.delete("wave");
    const search = params.toString();
    return path + (search ? `?${search}` : "") + globalThis.location.hash;
  }
  return url + globalThis.location.hash;
}

export const NavigationHistoryProvider: React.FC<{
  readonly children: ReactNode;
}> = ({ children }) => {
  const { hardBack } = useViewContext();
  const information = useWaveInformation();
  const pathname = usePathname();
  const router = useRouter();
  const [scrollRestoration] = useState(() =>
    createNavigationScrollRestoration({
      isNative: () => Capacitor.isNativePlatform(),
    })
  );
  useEffect(() => scrollRestoration.listen(), [scrollRestoration]);

  // The first entry never carries the query (mainSegment drops it).
  const historyRef = useRef<StackEntry[]>([
    { type: "route", path: mainSegment(pathname) },
  ]);
  const [{ index, canGoBack }, setPosition] = useState({
    index: 0,
    canGoBack: false,
  });
  const skipNext = useRef(false);
  const prevPathRef = useRef<string>("");

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const target =
      historyRef.current[getBackDestinationIndex(historyRef.current, index)];
    // Warm only the actual visited Back destination. Keep data freshness and
    // viewer-scoped query caches unchanged; this prepares the route shell.
    if (target?.type === "route" && target.href) router.prefetch(target.href);
  }, [index, router]);

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

  // Called from NavigationQuerySync's effect. That leaf is rendered after this
  // provider's children, so it runs after page effects and before any
  // ancestor's, in the same commit: where this provider's effect used to run.
  const observeUrl = useCallback(
    (url: string, currentPathname: string) => {
      scrollRestoration.committed(url + globalThis.location.hash);
      if (skipNext.current) {
        skipNext.current = false;
        prevPathRef.current = url;
        const current = historyRef.current.at(-1);
        if (current?.type === "route") {
          current.href = url + globalThis.location.hash;
        }
        return;
      }

      if (url === prevPathRef.current) return;
      prevPathRef.current = url;

      const pathKey = getHistoryRoutePath(url, currentPathname);
      let i = historyRef.current.length - 1;
      while (i >= 0 && historyRef.current[i]?.type === "view") i -= 1;
      const lastRoute = i >= 0 ? historyRef.current[i] : null;
      const isDuplicate =
        lastRoute?.type === "route" && lastRoute.path === pathKey;
      // Keep the full destination without adding a Back step per filter change.
      const href = getHistoryHref(url, pathKey);
      if (isDuplicate) {
        if (href) historyRef.current[i] = { ...lastRoute, href };
      } else {
        pushStack({ type: "route", path: pathKey, ...(href && { href }) });
      }
    },
    [pushStack, scrollRestoration]
  );

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
    const targetIndex = getBackDestinationIndex(historyRef.current, index);

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
      const href = target.href ?? target.path;
      if (scrollRestoration.prepare(href)) router.push(href, { scroll: false });
      else router.push(href);
    } else {
      hardBack(target!.view);
    }
    updatePosition(targetIndex);
  }, [
    canGoBack,
    index,
    router,
    hardBack,
    information,
    updatePosition,
    scrollRestoration,
  ]);

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
      if (scrollRestoration.prepare(path)) router.push(path, { scroll: false });
      else router.push(path);
      historyRef.current = historyRef.current.slice(0, targetIndex + 1);
      updatePosition(targetIndex);
    },
    [index, router, updatePosition, scrollRestoration]
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

  return (
    <Context.Provider value={value}>
      {children}
      {/* Reads the query, so it owns a Suspense boundary: a prerendered page
          renders this provider and its children without the query. */}
      <Suspense fallback={null}>
        <NavigationQuerySync observeUrl={observeUrl} />
      </Suspense>
    </Context.Provider>
  );
};

// useSearchParams() returns null outside an App Router context (for example
// in component tests), as main's provider allowed for.
function getFullPath(
  pathname: string,
  searchParams: ReadonlyURLSearchParams | null
): string {
  const query = searchParams?.toString();
  return pathname + (query ? `?${query}` : "");
}

function NavigationQuerySync({
  observeUrl,
}: {
  readonly observeUrl: (url: string, pathname: string) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath = getFullPath(pathname, searchParams);

  useEffect(() => {
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent -- This leaf only moves NavigationHistoryProvider's own URL effect inside a Suspense boundary; it must run here, after page effects in the same commit, as the provider's effect did (shellQueryParity.test.tsx).
    observeUrl(fullPath, pathname);
  }, [fullPath, pathname, searchParams, observeUrl]);

  return null;
}

export const useNavigationHistoryContext =
  (): NavigationHistoryContextValue => {
    const ctx = useContext(Context);
    if (!ctx)
      throw new Error(
        "useNavigationHistoryContext must be used within NavigationHistoryProvider"
      );
    return ctx;
  };
