"use client";

import { publicEnv } from "@/config/env";
import { usePathname, useSearchParams } from "next/navigation";
import { useMyStreamOptional } from "./wave/MyStreamContext";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type TitleContextType = {
  title: string;
  setTitle: (title: string) => void;
  notificationCount: number;
  setNotificationCount: (count: number) => void;
  setWaveData: (data: { name: string; newItemsCount: number } | null) => void;
  setStreamHasNewItems: (hasNewItems: boolean) => void;
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
  if (pathname.startsWith("/the-memes")) return "The Memes | Collections";
  if (pathname.startsWith("/meme-lab")) return "Meme Lab | Collections";
  if (pathname.startsWith("/network")) return "Network";
  if (pathname.startsWith("/6529-gradient"))
    return "6529 Gradient | Collections";
  if (pathname.startsWith("/nextgen")) return "NextGen | Collections";
  if (pathname.startsWith("/rememes")) return "Rememes | Collections";
  if (pathname.startsWith("/open-data")) return "Open Data | Tools";
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
      "tools",
      "about",
      "delegation",
      "meme-calendar",
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
  const [title, setTitle] = useState<string>(DEFAULT_TITLE);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [waveData, setWaveData] = useState<{
    name: string;
    newItemsCount: number;
  } | null>(null);
  const [streamHasNewItems, setStreamHasNewItems] = useState(false);
  const routeRef = useRef(pathname);
  const queryRef = useRef(searchParams);
  const waveParam =
    myStream?.activeWave.id ?? searchParams?.get("wave") ?? null;
  const isWaveRoute =
    pathname?.startsWith("/waves") ||
    pathname?.startsWith("/messages") ||
    (pathname === "/" && searchParams?.get("view") === "waves");

  useEffect(() => {
    if (routeRef.current === pathname) {
      return;
    }
    routeRef.current = pathname;
    const defaultTitle = getDefaultTitleForRoute(pathname);
    setTitle(defaultTitle);
  }, [pathname]);

  useEffect(() => {
    if (routeRef.current !== pathname) {
      routeRef.current = pathname;
      queryRef.current = searchParams;
      const defaultTitle = getDefaultTitleForRoute(pathname);
      setTitle(defaultTitle);
      setWaveData(null);
      setStreamHasNewItems(false);
    }
  }, [pathname, searchParams]);

  const updateTitle = (newTitle: string) => {
    if (routeRef.current === pathname) {
      setTitle(newTitle);
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

    if (isHomeFeedTab) {
      if (waveTitle) return waveTitle;

      const prefix =
        streamHasNewItems && notificationCount === 0
          ? "(New messages) My Stream"
          : "My Stream";
      return `${prefix} | Brain`;
    }

    if (isWaveRoute && waveTitle) {
      return waveTitle;
    }

    return title;
  }, [
    isHomeFeedTab,
    isWaveRoute,
    waveParam,
    waveData,
    streamHasNewItems,
    title,
    notificationCount,
  ]);

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
      setTitle: updateTitle,
      notificationCount,
      setNotificationCount,
      setWaveData,
      setStreamHasNewItems,
    };
  }, [computedTitle, notificationCount]);

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
