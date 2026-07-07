"use client";

import { usePathname, useSearchParams } from "next/navigation";
import React, {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { publicEnv } from "@/config/env";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";
import { useMyStreamOptional } from "./wave/MyStreamContext";

type TitleContextType = {
  title: string;
  // True when a page explicitly claimed the title (setTitle/wave data), as
  // opposed to the provider's route-default placeholder. Only owned titles
  // may overwrite the route's server metadata <title>.
  isTitleOwned: boolean;
  // Pathname the current title text was computed for. During a navigation
  // there is a render window where the text still belongs to the previous
  // route; consumers must not act on it for the new route until they match.
  titlePathname: string | null;
  setTitle: (title: string) => void;
  notificationCount: number;
  setNotificationCount: (count: number) => void;
  setWaveData: (data: { name: string; newItemsCount: number } | null) => void;
};

interface SearchParamsLike {
  get: (key: string) => string | null;
  toString: () => string;
}

type WaveTitleData = {
  name: string;
  newItemsCount: number;
};

type TitleState = {
  title: string;
  titlePathname: string | null;
  explicitTitlePathname: string | null;
  notificationCount: number;
  waveData: WaveTitleData | null;
};

type TitleAction =
  | { type: "reset-route-title"; pathname: string | null }
  | { type: "clear-wave-data" }
  | { type: "set-title"; title: string; pathname: string | null }
  | { type: "set-notification-count"; count: number }
  | { type: "set-wave-data"; data: WaveTitleData | null };

const TitleContext = createContext<TitleContextType | undefined>(undefined);

export const DEFAULT_TITLE = publicEnv.BASE_ENDPOINT?.includes("staging")
  ? "6529 Staging"
  : "6529.io";

// Default titles for routes
const getDefaultTitleForRoute = (pathname: string | null): string => {
  if (!pathname) return DEFAULT_TITLE;
  if (pathname === "/") return "6529.io";
  if (pathname.startsWith("/waves")) return "Waves | Brain";
  if (pathname.startsWith("/notifications")) return "Notifications | Brain";
  if (pathname.startsWith("/messages")) return "Messages | Brain";
  if (pathname.startsWith("/meme-calendar")) return "Memes Minting Calendar";
  if (pathname.startsWith("/the-memes")) return "The Memes | Collections";
  if (pathname.startsWith("/meme-lab")) return "Meme Lab | Collections";
  if (pathname.startsWith("/network")) return "Network";
  if (pathname.startsWith("/6529-gradient"))
    return "6529 Gradient | Collections";
  if (pathname.startsWith("/nextgen")) return "NextGen | Collections";
  if (pathname.startsWith("/rememes")) return "Rememes | Collections";
  if (pathname.startsWith("/open-data")) return "Open Data | Tools";
  if (pathname.startsWith("/discover")) return "Discovery";
  // Handle profile pages (e.g., /username)
  if (pathname !== "/" && pathname.split("/").length === 2) {
    const segments = pathname.split("/");
    const firstSegment = segments[1];
    // Check if it's not one of the known routes
    const knownRoutes = [
      "waves",
      "the-memes",
      "meme-lab",
      "network",
      "6529-gradient",
      "nextgen",
      "rememes",
      "open-data",
      "discover",
      "tools",
      "about",
      "delegation",
      "meme-calendar",
      "drop-forge",
    ];
    if (!knownRoutes.includes(firstSegment!)) {
      return `Profile | 6529.io`;
    }
  }
  return DEFAULT_TITLE;
};

const createInitialTitleState = (pathname: string | null): TitleState => ({
  title: getDefaultTitleForRoute(pathname),
  titlePathname: pathname,
  explicitTitlePathname: null,
  notificationCount: 0,
  waveData: null,
});

const titleReducer = (state: TitleState, action: TitleAction): TitleState => {
  switch (action.type) {
    case "reset-route-title":
      if (state.explicitTitlePathname === action.pathname) {
        return state.waveData ? { ...state, waveData: null } : state;
      }
      return {
        ...state,
        title: getDefaultTitleForRoute(action.pathname),
        titlePathname: action.pathname,
        explicitTitlePathname: null,
        waveData: null,
      };
    case "clear-wave-data":
      return state.waveData ? { ...state, waveData: null } : state;
    case "set-title":
      return {
        ...state,
        title: action.title,
        titlePathname: action.pathname,
        explicitTitlePathname: action.pathname,
      };
    case "set-notification-count":
      return state.notificationCount === action.count
        ? state
        : { ...state, notificationCount: action.count };
    case "set-wave-data":
      return { ...state, waveData: action.data };
  }
};

function TitleSearchParamsTracker({
  onChange,
}: {
  readonly onChange: (searchParams: SearchParamsLike | null) => void;
}) {
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense covered by TitleProvider Suspense wrapper
  const searchParams = useSearchParams();

  useEffect(() => {
    onChange(searchParams ?? null);
  }, [onChange, searchParams]);

  return null;
}

export const TitleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const myStream = useMyStreamOptional();
  const pathname = usePathname();
  const [searchParams, setSearchParams] = useState<SearchParamsLike | null>(
    null
  );
  const [titleState, dispatchTitle] = useReducer(
    titleReducer,
    pathname,
    createInitialTitleState
  );
  const {
    title,
    titlePathname,
    explicitTitlePathname,
    notificationCount,
    waveData,
  } = titleState;
  const routeRef = useRef(pathname);
  const currentPathRef = useRef(pathname);
  const searchParamsKeyRef = useRef<string | null>(null);
  const queryRef = useRef<SearchParamsLike | null>(searchParams);
  currentPathRef.current = pathname;
  const handleSearchParamsChange = useCallback(
    (nextSearchParams: SearchParamsLike | null) => {
      const nextSearchParamsKey = nextSearchParams?.toString() ?? null;
      if (searchParamsKeyRef.current === nextSearchParamsKey) {
        return;
      }
      searchParamsKeyRef.current = nextSearchParamsKey;
      setSearchParams(nextSearchParams);
    },
    []
  );
  const isWaveRoute =
    pathname?.startsWith("/waves") ||
    pathname?.startsWith("/messages") ||
    (pathname === "/" && searchParams?.get("view") === "waves");
  const waveParam = isWaveRoute
    ? (myStream?.activeWave.id ??
      getActiveWaveIdFromUrl({ pathname, searchParams }) ??
      null)
    : null;

  useEffect(() => {
    const previousPathname = routeRef.current;
    const previousSearchParams = queryRef.current;
    const pathnameChanged = previousPathname !== pathname;
    const currentWaveInUrl = getActiveWaveIdFromUrl({ pathname, searchParams });
    const previousWaveInUrl = getActiveWaveIdFromUrl({
      pathname: previousPathname,
      searchParams: previousSearchParams,
    });

    routeRef.current = pathname;
    queryRef.current = searchParams;

    if (pathnameChanged) {
      dispatchTitle({ type: "reset-route-title", pathname });
      return;
    }

    if (!isWaveRoute) {
      dispatchTitle({ type: "clear-wave-data" });
      return;
    }

    if (
      previousWaveInUrl &&
      (!currentWaveInUrl || previousWaveInUrl !== currentWaveInUrl)
    ) {
      dispatchTitle({ type: "reset-route-title", pathname });
    }
  }, [isWaveRoute, pathname, searchParams]);

  const updateTitle = useCallback((newTitle: string) => {
    if (currentPathRef.current === pathname) {
      dispatchTitle({ type: "set-title", title: newTitle, pathname });
    }
  }, [pathname]);

  const setNotificationCount = useCallback((count: number) => {
    dispatchTitle({ type: "set-notification-count", count });
  }, []);

  const setWaveData = useCallback((data: WaveTitleData | null) => {
    dispatchTitle({ type: "set-wave-data", data });
  }, []);

  // Compute the title based on current state
  const computedTitle = useMemo(() => {
    const waveTitle = (() => {
      if (!waveParam || !waveData) return null;
      let newItemsText = "";
      if (waveData.newItemsCount > 0 && notificationCount === 0) {
        const messageText =
          waveData.newItemsCount === 1 ? "message" : "messages";
        newItemsText = `(${waveData.newItemsCount} new ${messageText}) `;
      }
      return `${newItemsText}${waveData.name} | Brain`;
    })();

    if (isWaveRoute && waveTitle) {
      return waveTitle;
    }

    return title;
  }, [isWaveRoute, waveParam, waveData, title, notificationCount]);

  const isTitleOwned =
    (explicitTitlePathname !== null && explicitTitlePathname === pathname) ||
    Boolean(isWaveRoute && waveParam && waveData);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => {
    let notificationText = "";
    if (notificationCount === 1) {
      notificationText = "1 notification";
    } else if (notificationCount > 1) {
      notificationText = `${notificationCount} notifications`;
    }
    const finalTitle = notificationText
      ? `(${notificationText}) ${computedTitle}`
      : computedTitle;
    return {
      title: finalTitle,
      isTitleOwned,
      titlePathname,
      setTitle: updateTitle,
      notificationCount,
      setNotificationCount,
      setWaveData,
    };
  }, [
    computedTitle,
    isTitleOwned,
    notificationCount,
    setNotificationCount,
    setWaveData,
    titlePathname,
    updateTitle,
  ]);

  return (
    <TitleContext.Provider value={contextValue}>
      <Suspense fallback={null}>
        <TitleSearchParamsTracker onChange={handleSearchParamsChange} />
      </Suspense>
      {children}
    </TitleContext.Provider>
  );
};

export const useTitle = () => {
  const context = useContext(TitleContext);
  if (!context) {
    throw new Error("useTitle must be used within a TitleProvider");
  }
  return context;
};

// Hook to set page title - use this in page components
export const useSetTitle = (pageTitle: string) => {
  const { setTitle } = useTitle();
  const pathname = usePathname();

  // Set title immediately on mount and when title changes
  // react-doctor-disable-next-line react-doctor/no-derived-state-effect page title ownership is synchronized into TitleProvider context
  useEffect(() => {
    setTitle(pageTitle);
  }, [pageTitle, setTitle, pathname]);
};

// Hook to set wave data for title
export const useSetWaveData = (
  data: { name: string; newItemsCount: number } | null
) => {
  const { setWaveData } = useTitle();

  // react-doctor-disable-next-line react-doctor/no-derived-state-effect wave metadata is synchronized into TitleProvider context
  useEffect(() => {
    setWaveData(data);
  }, [data, setWaveData]);
};
