import { getMobileDestination } from "@/helpers/mobileAppDestination";

export const DeepLinkScope = {
  NAVIGATE: "navigate",
  SHARE_CONNECTION: "share-connection",
} as const;

const EXCLUDED_ROUTES = [
  "/open-mobile",
  "/access",
  "/restricted",
  "/accept-connection-sharing",
  "/app-wallets",
  "/tools/app-wallets",
  "/auth",
  "/api",
];

export function isMobileAppDestination(path: string): boolean {
  let pathname: string;
  try {
    pathname = decodeURIComponent(path.split(/[?#]/)[0] ?? "/");
  } catch {
    return false;
  }
  return !EXCLUDED_ROUTES.some(
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

export function getNativeLinkDestination(
  value: string,
  scheme: string,
  origin: string,
  timestamp: number
): string | null {
  try {
    const url = new URL(value);
    const allowedSchemes = [getMobileAppScheme(scheme), "mobile6529"];
    if (
      !allowedSchemes.some(
        (allowed) => url.protocol === `${allowed.toLowerCase()}:`
      ) ||
      url.username ||
      url.password ||
      url.port
    )
      return null;

    let pathname: string;
    if (url.hostname === DeepLinkScope.NAVIGATE) {
      pathname = url.pathname || "/";
    } else if (url.hostname === DeepLinkScope.SHARE_CONNECTION) {
      pathname = "/accept-connection-sharing";
    } else {
      return null;
    }

    // URLSearchParams preserves repeated parameters; fragments stay outside the query.
    url.searchParams.set("_t", String(timestamp));
    return getMobileDestination(`${pathname}${url.search}${url.hash}`, origin);
  } catch {
    return null;
  }
}
