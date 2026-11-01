import { getMobileDestination } from "@/helpers/mobileAppDestination";

export const DeepLinkScope = {
  NAVIGATE: "navigate",
  SHARE_CONNECTION: "share-connection",
} as const;

/** Routes that stay in the browser for app links and universal links alike. */
export const MOBILE_APP_EXCLUDED_ROUTES = [
  "/open-mobile",
  "/access",
  "/restricted",
  "/accept-connection-sharing",
  "/app-wallets",
  "/tools/app-wallets",
  "/auth",
  "/api",
] as const;

export function isMobileAppDestination(path: string): boolean {
  let pathname: string;
  try {
    pathname = decodeURIComponent(path.split(/[?#]/)[0] ?? "/");
  } catch {
    return false;
  }
  return !MOBILE_APP_EXCLUDED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function getMobilePlatform(
  userAgent: string,
  maxTouchPoints = 0
): "iOS" | "Android" | null {
  if (/Electron/i.test(userAgent)) return null;
  if (/Android/i.test(userAgent)) return "Android";
  if (
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)
  )
    return "iOS";
  return null;
}

function getMobileAppScheme(configuredScheme?: string): string {
  // Never let a malformed environment value become an executable URL scheme.
  return configuredScheme &&
    /^[a-z][a-z\d+.-]*$/i.test(configuredScheme) &&
    !/^(https?|javascript|data|intent|file)$/i.test(configuredScheme)
    ? configuredScheme
    : "mobile6529";
}

export function getMobileAppLink({
  destination,
  origin,
  scheme,
  userAgent,
  useIntent = true,
}: {
  readonly destination: string;
  readonly origin: string;
  readonly scheme: string;
  readonly userAgent: string;
  readonly useIntent?: boolean;
}): string | null {
  const path = getMobileDestination(destination, origin);
  if (!path || !isMobileAppDestination(path)) return null;

  const appScheme = getMobileAppScheme(scheme);
  const appUrl = `${appScheme}://${DeepLinkScope.NAVIGATE}${path}`;
  // Chrome's explicit browser fallback avoids guessing whether an app is installed.
  // Embedded browsers and other Android browsers retain the ordinary scheme link.
  const isAndroidChrome =
    /Android/i.test(userAgent) &&
    /Chrome\//.test(userAgent) &&
    !/; wv\)|SamsungBrowser|EdgA|OPR\//i.test(userAgent);
  if (!useIntent || !isAndroidChrome) return appUrl;

  const fallback = new URL("/open-mobile", origin);
  fallback.searchParams.set("path", path);
  return `intent://${DeepLinkScope.NAVIGATE}${path}#Intent;scheme=${appScheme};package=com.core6529.app;S.browser_fallback_url=${encodeURIComponent(fallback.href)};end`;
}

/** Hosts whose https links 6529 Mobile opens as universal links or App Links. */
const UNIVERSAL_LINK_HOSTS = new Set(["6529.io", "www.6529.io"]);

/**
 * Besides the excluded app routes, the apple-app-site-association file keeps
 * these in the browser: routes that never render a page, and file links. Only
 * file extensions match, because profile paths can be ENS names.
 */
const UNIVERSAL_LINK_NON_PAGE_ROUTES = [
  "/_next",
  "/.well-known",
  "/review-data",
];
const UNIVERSAL_LINK_FILE_EXTENSION =
  /\.(?:avif|csv|gif|html|ico|jpe?g|json|md|pdf|png|svg|txt|webp|xml|zip)$/i;

/** Query parameter that makes a repeated link to the same page navigate again. */
const NATIVE_LINK_TIMESTAMP_PARAM = "_t";

function isUniversalLinkPath(pathname: string): boolean {
  if (!isMobileAppDestination(pathname)) return false;
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return false;
  }
  return (
    !UNIVERSAL_LINK_NON_PAGE_ROUTES.some(
      (route) => decoded === route || decoded.startsWith(`${route}/`)
    ) && !UNIVERSAL_LINK_FILE_EXTENSION.test(decoded)
  );
}

/**
 * The host and path of a custom-scheme link. Android System WebView before
 * Chromium 130 parses `mobile6529://navigate/x` with an empty host and the
 * path `//navigate/x`; read the host from the path there, as current
 * parsers do.
 */
function getCustomSchemeParts(url: URL): {
  readonly host: string;
  readonly pathname: string;
} {
  if (url.hostname || !url.pathname.startsWith("//")) {
    return { host: url.hostname, pathname: url.pathname };
  }
  const rest = url.pathname.slice(2);
  const slash = rest.indexOf("/");
  return slash === -1
    ? { host: rest.toLowerCase(), pathname: "" }
    : { host: rest.slice(0, slash).toLowerCase(), pathname: rest.slice(slash) };
}

function getNativeLinkPathname(url: URL, scheme: string): string | null {
  if (url.protocol === "https:") {
    return UNIVERSAL_LINK_HOSTS.has(url.hostname) &&
      isUniversalLinkPath(url.pathname)
      ? url.pathname
      : null;
  }

  const allowedSchemes = [getMobileAppScheme(scheme), "mobile6529"];
  if (
    !allowedSchemes.some(
      (allowed) => url.protocol === `${allowed.toLowerCase()}:`
    )
  )
    return null;
  const { host, pathname } = getCustomSchemeParts(url);
  if (host === DeepLinkScope.NAVIGATE) return pathname || "/";
  if (host === DeepLinkScope.SHARE_CONNECTION)
    return "/accept-connection-sharing";
  return null;
}

/**
 * Maps a link the app was opened with to a root-relative destination, or null
 * to ignore it. Accepts `<scheme>://navigate/<path>`,
 * `<scheme>://share-connection?...` and https universal links / App Links on
 * the 6529.io hosts, except paths the association file keeps in the browser.
 */
export function getNativeLinkDestination(
  value: string,
  scheme: string,
  origin: string,
  timestamp: number
): string | null {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.port) return null;
    const pathname = getNativeLinkPathname(url, scheme);
    if (!pathname) return null;

    // URLSearchParams preserves repeated parameters; fragments stay outside the query.
    url.searchParams.set(NATIVE_LINK_TIMESTAMP_PARAM, String(timestamp));
    return getMobileDestination(`${pathname}${url.search}${url.hash}`, origin);
  } catch {
    return null;
  }
}

function getComparableLocation(value: string, origin: string): string {
  const url = new URL(value, origin);
  url.searchParams.delete(NATIVE_LINK_TIMESTAMP_PARAM);
  // Stable: keeps the order of repeated values of one parameter.
  url.searchParams.sort();
  let pathname = url.pathname;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }
  try {
    pathname = decodeURI(pathname);
  } catch {
    // Compare the encoded form.
  }
  return `${url.origin}${pathname}?${url.searchParams.toString()}${url.hash}`;
}

/**
 * Whether `destination` (from getNativeLinkDestination) is the page `current`
 * already shows: same pathname (ignoring a trailing slash and equivalent
 * percent-encoding), same query parameters (ignoring the navigation timestamp
 * and the order of different parameters) and same fragment.
 */
export function isCurrentNativeLinkLocation(
  destination: string,
  current: string,
  origin: string
): boolean {
  try {
    return (
      getComparableLocation(destination, origin) ===
      getComparableLocation(current, origin)
    );
  } catch {
    return false;
  }
}
