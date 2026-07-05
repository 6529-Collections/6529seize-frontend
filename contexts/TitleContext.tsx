"use client";

import { usePathname, useSearchParams } from "next/navigation";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
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

export const TitleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const myStream = useMyStreamOptional();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState<string>(() =>
    getDefaultTitleForRoute(pathname)
  );
  // Pathname the current title text was computed for.
  const [titlePathname, setTitlePathname] = useState<string | null>(pathname);
  // Pathname the explicit title was claimed for: ownership evaporates in the
  // same render as a navigation, before any effect-based reset runs.
  const [explicitTitlePathname, setExplicitTitlePathname] = useState<
    string | null
  >(null);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [waveData, setWaveData] = useState<{
    name: string;
    newItemsCount: number;
  } | null>(null);
  const routeRef = useRef(pathname);
  const queryRef = useRef(searchParams);
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
      setTitle(getDefaultTitleForRoute(pathname));
      setTitlePathname(pathname);
      setExplicitTitlePathname(null);
      setWaveData(null);
      return;
    }

    if (!isWaveRoute) {
      setWaveData(null);
      return;
    }

    if (
      previousWaveInUrl &&
      (!currentWaveInUrl || previousWaveInUrl !== currentWaveInUrl)
    ) {
      setTitle(getDefaultTitleForRoute(pathname));
      setTitlePathname(pathname);
      setExplicitTitlePathname(null);
      setWaveData(null);
    }
  }, [pathname, searchParams]);

  const updateTitle = (newTitle: string) => {
    if (routeRef.current === pathname) {
      setTitle(newTitle);
      setTitlePathname(pathname);
      setExplicitTitlePathname(pathname);
    }
  };

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
  }, [computedTitle, isTitleOwned, notificationCount, titlePathname]);

  return (
    <TitleContext.Provider value={contextValue}>
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
  useEffect(() => {
    setTitle(pageTitle);
  }, [pageTitle, setTitle, pathname]);
};

// Hook to set wave data for title
export const useSetWaveData = (
  data: { name: string; newItemsCount: number } | null
) => {
  const { setWaveData } = useTitle();

  useEffect(() => {
    setWaveData(data);
  }, [data, setWaveData]);
};
