export const mainSegment = (url: string): string => {
  const pathname = url.split(/[?#]/)[0];
  const [, first] = pathname!.split("/");
  return first ? `/${first.toLowerCase()}` : "/";
};

export const sameMainPath = (a: string, b: string): boolean =>
  mainSegment(a) === mainSegment(b);

export const getHomeRoute = (): string => "/";

export const getWavesBaseRoute = (_isApp: boolean): string => "/waves";

export const getMessagesBaseRoute = (_isApp: boolean): string => "/messages";

export const getNotificationsRoute = (_isApp: boolean): string =>
  "/notifications";

const MOBILE_BOTTOM_NAV_SCROLL_TARGET_ATTRIBUTE =
  "data-mobile-bottom-nav-scroll-target";
export const MOBILE_BOTTOM_NAV_SCROLL_TARGET_SELECTOR = `[${MOBILE_BOTTOM_NAV_SCROLL_TARGET_ATTRIBUTE}="true"]`;

export const MOBILE_BOTTOM_NAV_DOCK_ATTRIBUTE = "data-mobile-bottom-nav-dock";
export const MOBILE_BOTTOM_NAV_DOCK_SELECTOR = `[${MOBILE_BOTTOM_NAV_DOCK_ATTRIBUTE}="true"]`;

export const MOBILE_BOTTOM_NAV_ROOT_ATTRIBUTE = "data-mobile-bottom-nav-root";
export const MOBILE_BOTTOM_NAV_ROOT_SELECTOR = `[${MOBILE_BOTTOM_NAV_ROOT_ATTRIBUTE}="true"]`;

// BottomNavigation dock transitions use tw-duration-300; this window keeps
// overlay measurements running through the full animation plus settling margin.
export const MOBILE_BOTTOM_NAV_DOCK_MEASUREMENT_WINDOW_MS = 420;

export const usesReverseMobileBottomNavigationScroll = ({
  pathname,
}: {
  pathname: string | null | undefined;
}): boolean => {
  if (!pathname) {
    return false;
  }

  return (
    pathname === "/notifications" || pathname.startsWith("/notifications/")
  );
};

interface SearchParamsLike {
  get: (key: string) => string | null;
}

export type RouteSearchParams = Record<string, string | string[] | undefined>;

const CREATE_SEGMENT = "create";

export const getWavePathRoute = (waveId: string): string =>
  `/waves/${encodeURIComponent(waveId)}`;

export const getMessagePathRoute = (waveId: string): string =>
  `/messages/${encodeURIComponent(waveId)}`;

export const getWaveIdFromPathname = (
  pathname: string | null | undefined
): string | null => {
  if (!pathname?.startsWith("/waves/")) {
    return null;
  }

  const [, wavesSegment, waveSegment] = pathname.split("/");
  if (
    wavesSegment !== "waves" ||
    !waveSegment ||
    waveSegment === CREATE_SEGMENT
  ) {
    return null;
  }

  try {
    return decodeURIComponent(waveSegment);
  } catch {
    return waveSegment;
  }
};

export const getMessageIdFromPathname = (
  pathname: string | null | undefined
): string | null => {
  if (!pathname?.startsWith("/messages/")) {
    return null;
  }

  const [, messagesSegment, waveSegment] = pathname.split("/");
  if (
    messagesSegment !== "messages" ||
    !waveSegment ||
    waveSegment === CREATE_SEGMENT
  ) {
    return null;
  }

  try {
    return decodeURIComponent(waveSegment);
  } catch {
    return waveSegment;
  }
};

export const hidesMobileBottomNavigation = ({
  pathname,
}: {
  pathname: string | null | undefined;
}): boolean =>
  getWaveIdFromPathname(pathname) !== null ||
  getMessageIdFromPathname(pathname) !== null;

export const getActiveWaveIdFromUrl = ({
  pathname,
  searchParams,
}: {
  pathname: string | null | undefined;
  searchParams?: SearchParamsLike | null | undefined;
}): string | null => {
  const waveIdFromPath = getWaveIdFromPathname(pathname);
  if (waveIdFromPath) {
    return waveIdFromPath;
  }

  const messageIdFromPath = getMessageIdFromPathname(pathname);
  if (messageIdFromPath) {
    return messageIdFromPath;
  }

  const waveIdFromQuery = searchParams?.get("wave");
  return typeof waveIdFromQuery === "string" ? waveIdFromQuery : null;
};

export const getWaveRoute = ({
  waveId,
  serialNo,
  extraParams,
  isDirectMessage,
  isApp: _isApp,
}: {
  waveId: string;
  serialNo?: string | number | undefined;
  extraParams?: Record<string, string | undefined> | undefined;
  isDirectMessage: boolean;
  isApp: boolean;
}): string => {
  const queryEntries: Array<[string, string]> = [];

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value !== undefined) {
        queryEntries.push([key, value]);
      }
    }
  }

  const base = isDirectMessage
    ? getMessagePathRoute(waveId)
    : getWavePathRoute(waveId);

  if (serialNo !== undefined) {
    queryEntries.push(["serialNo", `${serialNo}`]);
  }

  if (queryEntries.length === 0) {
    return base;
  }

  const query = queryEntries
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");

  return `${base}?${query}`;
};

export const getWaveRouteWithSearchParams = ({
  waveId,
  searchParams,
  isDirectMessage,
}: {
  waveId: string;
  searchParams: RouteSearchParams;
  isDirectMessage: boolean;
}): string => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "wave" || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    params.set(key, value);
  }

  const path = isDirectMessage
    ? getMessagePathRoute(waveId)
    : getWavePathRoute(waveId);
  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
};

export const getWaveHomeRoute = ({
  isDirectMessage,
  isApp,
}: {
  isDirectMessage: boolean;
  isApp: boolean;
}): string => {
  return isDirectMessage
    ? getMessagesBaseRoute(isApp)
    : getWavesBaseRoute(isApp);
};

export const navigateToDirectMessage = ({
  waveId,
  router,
  isApp,
}: {
  waveId: string;
  router: { push: (url: string) => void; replace: (url: string) => void };
  isApp: boolean;
}): void => {
  const href = getWaveRoute({
    waveId,
    isDirectMessage: true,
    isApp,
  });
  if (isApp) {
    router.replace(href);
  } else {
    router.push(href);
  }
};
