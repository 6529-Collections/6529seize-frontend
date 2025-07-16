import { SplashScreen } from "@capacitor/splash-screen";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export interface RouterWrapper {
  replace: (url: string) => void | Promise<boolean>;
}

export enum DeepLinkScope {
  NAVIGATE = "navigate",
  SHARE_CONNECTION = "share-connection",
}

export function resolveDeepLink(
  deepLinkUrl: string
): { pathname: string; queryParams: Record<string, string | number> } | null {
  if (!deepLinkUrl) {
    return null;
  }

  try {
    let pathPart = deepLinkUrl;
    if (deepLinkUrl.includes("://")) {
      const schemeEndIndex = deepLinkUrl.indexOf("://") + 3;
      pathPart = deepLinkUrl.slice(schemeEndIndex);
    }

    const [rawPath, queryString = ""] = pathPart.split("?");

    const [scope, ...pathParts] = rawPath.split("/");

    const searchParams = new URLSearchParams(queryString);
    const queryParams: Record<string, string | number> = Object.fromEntries(
      searchParams.entries()
    );

    let pathname: string;

    switch (scope) {
      case DeepLinkScope.NAVIGATE:
        pathname = `/${pathParts.join("/")}`;
        break;
      case DeepLinkScope.SHARE_CONNECTION:
        pathname = "/accept-connection-sharing";
        break;
      default:
        pathname = "/";
        break;
    }

    return {
      pathname,
      queryParams,
    };
  } catch (e) {
    console.error("Failed to resolve deep link:", e);
    return null;
  }
}

export async function initDeepLink(router: RouterWrapper): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  // Guard #1: only initial history entry
  const hist = window.history.state;
  if (hist?.idx > 0) {
    await SplashScreen.hide();
    return;
  }

  // Guard #2: only once per session
  const key = "deepLinkHandled";
  if (!sessionStorage.getItem(key)) {
    const info = await CapacitorApp.getLaunchUrl();
    sessionStorage.setItem(key, "1");

    if (info?.url) {
      const resolved = resolveDeepLink(info.url);
      if (resolved) {
        const params = new URLSearchParams(
          Object.entries(resolved.queryParams).map(([k, v]) => [k, String(v)])
        );
        const targetUrl = `${resolved.pathname}${
          params.toString() ? `?${params.toString()}` : ""
        }`;
        await Promise.resolve(router.replace(targetUrl));
      } else {
        console.warn("initDeepLink: launch URL did not resolve:", info.url);
      }
    }
  }

  await SplashScreen.hide();
}
