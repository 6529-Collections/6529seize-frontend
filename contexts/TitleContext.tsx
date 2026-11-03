"use client";

import {
  type ReadonlyURLSearchParams,
  usePathname,
  useSearchParams,
} from "next/navigation";
import React, {
  createContext,
  Suspense,
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
import { isTitleUpdateCurrent, STREAM_INDEX_ROUTES } from "./title.helpers";
import { useMyStreamOptional } from "./wave/MyStreamContext";

// The provider's own state. The title text and ownership also depend on the
// URL query (`?wave=`, `/?view=waves`), so readers derive them with
// useTitleText, which reads the query in the same render as a navigation.
type TitleState = {
  readonly title: string;
  // Pathname the current title text was computed for. During a navigation
  // there is a render window where the text still belongs to the previous
  // route; consumers must not act on it for the new route until they match.
  readonly titlePathname: string | null;
  // Pathname the explicit title was claimed for.
  readonly explicitTitlePathname: string | null;
  readonly notificationCount: number;
  readonly waveData: WaveTitleData | null;
  readonly locale: SupportedLocale;
};

type TitleText = {
  readonly title: string;
  // True when a page explicitly claimed the title (setTitle/wave data), as
  // opposed to the provider's route-default placeholder. Only owned titles
  // may overwrite the route's server metadata <title>.
  readonly isTitleOwned: boolean;
  readonly titlePathname: string | null;
};

type WaveTitleData = {
  id: string;
  name: string;
  newItemsCount: number;
};

type TitleActionsContextType = {
  readonly setTitle: (title: string) => void;
  readonly setNotificationCount: (count: number) => void;
  readonly setWaveData: (data: WaveTitleData | null) => void;
};

type TitleContextType = TitleState & TitleActionsContextType;

const TitleContext = createContext<TitleContextType | undefined>(undefined);

// Pages and nav items only set the title. Keeping the setters in their own
// context stops them re-rendering whenever the title text changes, which
// happens on every new message in the open wave.
const TitleActionsContext = createContext<TitleActionsContextType | undefined>(
  undefined
);

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
  if (pathname === "/") return DEFAULT_TITLE;
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

const isWaveRouteFor = (
  pathname: string,
  searchParams: Pick<URLSearchParams, "get">
): boolean =>
  STREAM_INDEX_ROUTES.some((route) => pathname.startsWith(route)) ||
  (pathname === "/" && searchParams.get("view") === "waves");

type RouteObservation = {
  readonly pathname: string;
  readonly locale: SupportedLocale;
  readonly previousSearchParams: ReadonlyURLSearchParams;
  readonly isWaveRoute: boolean;
  readonly waveInUrl: string | null;
};

export const TitleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname();
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
  const localeRef = useRef(locale);

  // Called from TitleQuerySync's effect. That leaf is rendered after this
  // provider's children, so it runs after page effects and before any
  // ancestor's, in the same commit: where this provider's effect used to run.
  const observeRoute = useCallback(
    ({
      pathname: currentPathname,
      locale: currentLocale,
      previousSearchParams,
      isWaveRoute,
      waveInUrl: currentWaveInUrl,
    }: RouteObservation) => {
      const previousPathname = routeRef.current;
      const previousLocale = localeRef.current;
      const pathnameChanged = previousPathname !== currentPathname;
      const localeChanged = previousLocale !== currentLocale;
      const previousWaveInUrl = getActiveWaveIdFromUrl({
        pathname: previousPathname,
        searchParams: previousSearchParams,
      });

      routeRef.current = currentPathname;
      localeRef.current = currentLocale;

      if (pathnameChanged) {
        setTitle(getDefaultTitleForRoute(currentPathname, currentLocale));
        setTitlePathname(currentPathname);
        setExplicitTitlePathname(null);
        setWaveData((current) =>
          current?.id === currentWaveInUrl ? current : null
        );
        return;
      }

      if (
        localeChanged &&
        titlePathname === currentPathname &&
        explicitTitlePathname !== currentPathname
      ) {
        setTitle(getDefaultTitleForRoute(currentPathname, currentLocale));
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
        setTitle(getDefaultTitleForRoute(currentPathname, currentLocale));
        setTitlePathname(currentPathname);
        setExplicitTitlePathname(null);
        setWaveData((current) =>
          current?.id === currentWaveInUrl ? current : null
        );
      }
    },
    [explicitTitlePathname, titlePathname]
  );

  const updateTitle = useCallback(
    (newTitle: string) => {
      if (isTitleUpdateCurrent(routeRef.current, titlePathname, pathname)) {
        setTitle(newTitle);
        setTitlePathname(pathname);
        setExplicitTitlePathname(pathname);
      }
    },
    [pathname, titlePathname]
  );

  const actionsValue = useMemo<TitleActionsContextType>(
    () => ({
      setTitle: updateTitle,
      setNotificationCount,
      setWaveData,
    }),
    [updateTitle]
  );

  const contextValue = useMemo<TitleContextType>(
    () => ({
      title,
      titlePathname,
      explicitTitlePathname,
      notificationCount,
      waveData,
      locale,
      ...actionsValue,
    }),
    [
      actionsValue,
      explicitTitlePathname,
      locale,
      notificationCount,
      title,
      titlePathname,
      waveData,
    ]
  );

  return (
    <TitleActionsContext.Provider value={actionsValue}>
      <TitleContext.Provider value={contextValue}>
        {children}
        {/* Reads the query, so it owns a Suspense boundary: a prerendered page
            renders this provider and its children without the query. */}
        <Suspense fallback={null}>
          <TitleQuerySync
            pathname={pathname}
            locale={locale}
            observeRoute={observeRoute}
          />
        </Suspense>
      </TitleContext.Provider>
    </TitleActionsContext.Provider>
  );
};

function TitleQuerySync({
  pathname,
  locale,
  observeRoute,
}: {
  readonly pathname: string;
  readonly locale: SupportedLocale;
  readonly observeRoute: (observation: RouteObservation) => void;
}) {
  const searchParams = useSearchParams();
  const queryRef = useRef(searchParams);
  const isWaveRoute = isWaveRouteFor(pathname, searchParams);
  const waveInUrl = getActiveWaveIdFromUrl({ pathname, searchParams });

  useEffect(() => {
    const previousSearchParams = queryRef.current;
    queryRef.current = searchParams;
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent, react-you-might-not-need-an-effect/no-pass-ref-to-parent -- This leaf only moves TitleProvider's own route effect inside a Suspense boundary; it must run here, after page effects in the same commit, as the provider's effect did (shellQueryParity.test.tsx).
    observeRoute({
      pathname,
      locale,
      previousSearchParams,
      isWaveRoute,
      waveInUrl,
    });
  }, [isWaveRoute, locale, observeRoute, pathname, searchParams, waveInUrl]);

  return null;
}

const useTitleContext = (hookName: string): TitleContextType => {
  const context = useContext(TitleContext);
  if (!context) {
    throw new Error(`${hookName} must be used within a TitleProvider`);
  }
  return context;
};

/** Title setters and the notification count. Does not read the URL query. */
export const useTitle = () => {
  const { setTitle, setNotificationCount, setWaveData, notificationCount } =
    useTitleContext("useTitle");
  return { setTitle, setNotificationCount, setWaveData, notificationCount };
};

/**
 * The document title text, whether a page owns it, and the route it belongs
 * to. Reads the URL query in the same render as a navigation, so render it
 * under a Suspense boundary, as DynamicHeadTitle does.
 */
export const useTitleText = (): TitleText => {
  const {
    title,
    titlePathname,
    explicitTitlePathname,
    notificationCount,
    waveData,
    locale,
  } = useTitleContext("useTitleText");
  const myStream = useMyStreamOptional();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isWaveRoute = isWaveRouteFor(pathname, searchParams);
  const waveInUrl = getActiveWaveIdFromUrl({ pathname, searchParams });
  const fallbackActiveWaveId =
    pathname === "/" ? (myStream?.activeWave.id ?? null) : null;
  const waveParam = isWaveRoute ? (waveInUrl ?? fallbackActiveWaveId) : null;

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

  return useMemo(() => {
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
    return { title: finalTitle, isTitleOwned, titlePathname };
  }, [computedTitle, isTitleOwned, locale, notificationCount, titlePathname]);
};

/** Title setters without subscribing to title text changes. */
export const useTitleActions = () => {
  const context = useContext(TitleActionsContext);
  if (!context) {
    throw new Error("useTitleActions must be used within a TitleProvider");
  }
  return context;
};

// Hook to set page title - use this in page components
export const useSetTitle = (pageTitle: string) => {
  const { setTitle } = useTitleActions();
  const pathname = usePathname();

  // Set title immediately on mount and when title changes
  useEffect(() => {
    setTitle(pageTitle);
  }, [pageTitle, setTitle, pathname]);
};

// Hook to set wave data for title
export const useSetWaveData = (data: WaveTitleData | null) => {
  const { setWaveData } = useTitleActions();

  useEffect(() => {
    setWaveData(data);
  }, [data, setWaveData]);
};
