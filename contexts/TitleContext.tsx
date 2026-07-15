"use client";

import { usePathname, useSearchParams } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { publicEnv } from "@/config/env";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
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
  setWaveData: (data: WaveTitleData | null) => void;
};

type WaveTitleData = {
  id: string;
  name: string;
  newItemsCount: number;
};

const TitleContext = createContext<TitleContextType | undefined>(undefined);

export const DEFAULT_TITLE = publicEnv.BASE_ENDPOINT?.includes("staging")
  ? "6529 Staging"
  : "6529.io";

const ROUTE_TITLE_KEYS = [
  ["/waves", "titleContext.routes.waves"],
  ["/notifications", "titleContext.routes.notifications"],
  ["/messages", "titleContext.routes.messages"],
  ["/meme-calendar", "titleContext.routes.memeCalendar"],
  ["/the-memes", "titleContext.routes.theMemes"],
  ["/meme-lab", "titleContext.routes.memeLab"],
  ["/network", "titleContext.routes.network"],
  ["/6529-gradient", "titleContext.routes.gradient"],
  ["/nextgen", "titleContext.routes.nextGen"],
  ["/rememes", "titleContext.routes.rememes"],
  ["/open-data", "titleContext.routes.openData"],
  ["/discover", "titleContext.routes.discovery"],
] as const;

// Default titles for routes
const getDefaultTitleForRoute = (
  pathname: string | null,
  locale: SupportedLocale
): string => {
  if (!pathname) return DEFAULT_TITLE;
  if (pathname === "/") return "6529.io";
  const routeTitle = ROUTE_TITLE_KEYS.find(([prefix]) =>
    pathname.startsWith(prefix)
  );
  if (routeTitle) return t(locale, routeTitle[1]);
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
      return t(locale, "titleContext.routes.profile");
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
  const locale = useBrowserLocale();
  const [title, setTitle] = useState<string>(() =>
    getDefaultTitleForRoute(pathname, locale)
  );
  // Pathname the current title text was computed for.
  const [titlePathname, setTitlePathname] = useState<string | null>(pathname);
  // Pathname the explicit title was claimed for: ownership evaporates in the
  // same render as a navigation, before any effect-based reset runs.
  const [explicitTitlePathname, setExplicitTitlePathname] = useState<
    string | null
  >(null);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [waveData, setWaveData] = useState<WaveTitleData | null>(null);
  const routeRef = useRef(pathname);
  const queryRef = useRef(searchParams);
  const isWaveRoute =
    pathname?.startsWith("/waves") ||
    pathname?.startsWith("/messages") ||
    (pathname === "/" && searchParams?.get("view") === "waves");
  const waveInUrl = getActiveWaveIdFromUrl({ pathname, searchParams });
  const fallbackActiveWaveId =
    pathname === "/" ? (myStream?.activeWave.id ?? null) : null;
  const waveParam = isWaveRoute ? (waveInUrl ?? fallbackActiveWaveId) : null;

  useEffect(() => {
    const previousPathname = routeRef.current;
    const previousSearchParams = queryRef.current;
    const pathnameChanged = previousPathname !== pathname;
    const currentWaveInUrl = waveInUrl;
    const previousWaveInUrl = getActiveWaveIdFromUrl({
      pathname: previousPathname,
      searchParams: previousSearchParams,
    });

    routeRef.current = pathname;
    queryRef.current = searchParams;

    if (pathnameChanged) {
      setTitle(getDefaultTitleForRoute(pathname, locale));
      setTitlePathname(pathname);
      setExplicitTitlePathname(null);
      setWaveData((current) =>
        current?.id === currentWaveInUrl ? current : null
      );
      return;
    }

    if (!isWaveRoute) {
      setWaveData((current) =>
        current?.id === currentWaveInUrl ? current : null
      );
      return;
    }

    if (
      previousWaveInUrl &&
      (!currentWaveInUrl || previousWaveInUrl !== currentWaveInUrl)
    ) {
      setTitle(getDefaultTitleForRoute(pathname, locale));
      setTitlePathname(pathname);
      setExplicitTitlePathname(null);
      setWaveData((current) =>
        current?.id === currentWaveInUrl ? current : null
      );
    }
  }, [isWaveRoute, locale, pathname, searchParams, waveInUrl]);

  const isTitleRouteCurrent = titlePathname === pathname;
  const updateTitle = useCallback(
    (newTitle: string) => {
      if (routeRef.current === pathname || isTitleRouteCurrent) {
        setTitle(newTitle);
        setTitlePathname(pathname);
        setExplicitTitlePathname(pathname);
      }
    },
    [isTitleRouteCurrent, pathname]
  );

  // Compute the title based on current state
  const computedTitle = useMemo(() => {
    const waveTitle = (() => {
      if (!waveParam || waveData?.id !== waveParam) return null;
      if (waveData.newItemsCount > 0 && notificationCount === 0) {
        const pluralCategory = new Intl.PluralRules(locale).select(
          waveData.newItemsCount
        );
        const messageKey =
          pluralCategory === "one"
            ? "titleContext.wave.newMessages.one"
            : "titleContext.wave.newMessages.other";
        return t(locale, messageKey, {
          count: formatInteger(locale, waveData.newItemsCount),
          waveName: waveData.name,
        });
      }
      return t(locale, "titleContext.wave.default", {
        waveName: waveData.name,
      });
    })();

    if (isWaveRoute && waveTitle) {
      return waveTitle;
    }

    return title;
  }, [isWaveRoute, locale, waveParam, waveData, title, notificationCount]);

  const isTitleOwned =
    (explicitTitlePathname !== null && explicitTitlePathname === pathname) ||
    Boolean(isWaveRoute && waveParam && waveData?.id === waveParam);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => {
    const notificationPluralCategory = new Intl.PluralRules(locale).select(
      notificationCount
    );
    const notificationKey =
      notificationPluralCategory === "one"
        ? "titleContext.notifications.one"
        : "titleContext.notifications.other";
    const finalTitle =
      notificationCount > 0
        ? t(locale, notificationKey, {
            count: formatInteger(locale, notificationCount),
            title: computedTitle,
          })
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
    locale,
    notificationCount,
    titlePathname,
    updateTitle,
  ]);

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
export const useSetWaveData = (data: WaveTitleData | null) => {
  const { setWaveData } = useTitle();

  useEffect(() => {
    setWaveData(data);
  }, [data, setWaveData]);
};
